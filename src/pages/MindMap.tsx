import { useCallback, useState, useEffect, useRef } from 'react';
import { useMindMapUndo } from '@/hooks/useMindMapUndo';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Network, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  MindMapNode,
  MindMapEdge,
  NodeDialog,
  ConnectionDialog,
  ConnectionsPanel,
  EntityImportDialog,
  MindMapToolbar,
  ExportDialog,
  ImportJsonDialog,
  NODE_TYPES,
  CONNECTION_TYPES,
  MindMapNodeData,
  NodeType,
  ConnectionType,
} from '@/components/mindmap';
import type { ImportJsonData } from '@/components/mindmap';

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };

function MindMapContent() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeDataMap, setNodeDataMap] = useState<Map<string, MindMapNodeData>>(new Map());

  // Dialog states
  const [isNodeDialogOpen, setIsNodeDialogOpen] = useState(false);
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false);
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportJsonDialogOpen, setIsImportJsonDialogOpen] = useState(false);
  const [isConnectionsPanelOpen, setIsConnectionsPanelOpen] = useState(false);
  // Form states
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeContent, setNodeContent] = useState('');
  const [nodeType, setNodeType] = useState<NodeType>('idea');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Connection editing
  const [editingConnection, setEditingConnection] = useState<Edge | null>(null);
  const [connectionLabel, setConnectionLabel] = useState('');
  const [connectionType, setConnectionType] = useState<ConnectionType>('default');

  // Selection and deletion
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [copiedNodeIds, setCopiedNodeIds] = useState<string[]>([]);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const { pushAction, popAction, canUndo } = useMindMapUndo();

  // Load data from database
  useEffect(() => {
    if (!activeCampaign) return;

    const loadMindMap = async () => {
      const [nodesRes, connectionsRes] = await Promise.all([
        supabase
          .from('mind_map_nodes')
          .select('*')
          .eq('campaign_id', activeCampaign.id),
        supabase
          .from('mind_map_connections')
          .select('*')
          .eq('campaign_id', activeCampaign.id),
      ]);

      if (nodesRes.error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar mapa', description: nodesRes.error.message });
        return;
      }
      if (connectionsRes.error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar conexões', description: connectionsRes.error.message });
        return;
      }

      const dataMap = new Map<string, MindMapNodeData>();
      nodesRes.data.forEach((n) => dataMap.set(n.id, n as MindMapNodeData));
      setNodeDataMap(dataMap);

      const formattedNodes: Node[] = nodesRes.data.map((node) => ({
        id: node.id,
        type: 'mindmap',
        position: { x: node.position_x || 0, y: node.position_y || 0 },
        data: {
          label: node.title,
          nodeData: node as MindMapNodeData,
          isSelected: false,
        },
      }));

      const formattedEdges: Edge[] = connectionsRes.data.map((conn) => ({
        id: conn.id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        type: 'mindmap',
        data: {
          label: conn.label,
          connectionType: conn.connection_type || 'default',
        },
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    };

    loadMindMap();
  }, [activeCampaign]);

  // Update node callbacks when handlers change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onEdit: handleEditNode,
          onDelete: handleConfirmDelete,
          onDuplicate: handleDuplicateNode,
        },
      }))
    );
  }, [nodeDataMap]);



  // Undo handler
  const handleUndo = useCallback(async () => {
    const action = popAction();
    if (!action) return;

    switch (action.type) {
      case 'create_node': {
        // Undo create = delete the node
        await supabase.from('mind_map_connections').delete()
          .or(`source_node_id.eq.${action.nodeId},target_node_id.eq.${action.nodeId}`);
        await supabase.from('mind_map_nodes').delete().eq('id', action.nodeId);
        setNodes((nds) => nds.filter((n) => n.id !== action.nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== action.nodeId && e.target !== action.nodeId));
        nodeDataMap.delete(action.nodeId);
        setNodeDataMap(new Map(nodeDataMap));
        break;
      }
      case 'delete_node': {
        // Undo delete = re-create the node and its edges
        const { data } = await supabase.from('mind_map_nodes').insert({
          id: action.nodeData.id,
          campaign_id: action.nodeData.campaign_id,
          user_id: action.nodeData.user_id,
          title: action.nodeData.title,
          content: action.nodeData.content,
          node_type: action.nodeData.node_type,
          color: action.nodeData.color,
          position_x: action.position.x,
          position_y: action.position.y,
          entity_id: action.nodeData.entity_id,
          entity_type: action.nodeData.entity_type,
        }).select().single();

        if (data) {
          const nd = data as MindMapNodeData;
          nodeDataMap.set(data.id, nd);
          setNodeDataMap(new Map(nodeDataMap));
          setNodes((nds) => [...nds, {
            id: data.id, type: 'mindmap',
            position: action.position,
            data: { label: data.title, nodeData: nd, isSelected: false },
          }]);

          // Re-create edges
          for (const edge of action.edges) {
            const { data: edgeData } = await supabase.from('mind_map_connections').insert({
              id: edge.id,
              campaign_id: action.nodeData.campaign_id,
              user_id: action.nodeData.user_id,
              source_node_id: edge.source,
              target_node_id: edge.target,
              label: edge.label,
              connection_type: edge.connectionType,
            }).select().single();
            if (edgeData) {
              setEdges((eds) => [...eds, {
                id: edgeData.id, source: edgeData.source_node_id, target: edgeData.target_node_id,
                type: 'mindmap', data: { label: edgeData.label, connectionType: edgeData.connection_type || 'default' },
              }]);
            }
          }
        }
        break;
      }
      case 'move_node': {
        await supabase.from('mind_map_nodes').update({
          position_x: action.oldPosition.x, position_y: action.oldPosition.y,
        }).eq('id', action.nodeId);
        setNodes((nds) => nds.map((n) =>
          n.id === action.nodeId ? { ...n, position: action.oldPosition } : n
        ));
        break;
      }
      case 'create_edge': {
        await supabase.from('mind_map_connections').delete().eq('id', action.edgeId);
        setEdges((eds) => eds.filter((e) => e.id !== action.edgeId));
        break;
      }
      case 'delete_edge': {
        // Undo delete = re-create the edge
        const { data: restoredEdge } = await supabase.from('mind_map_connections').insert({
          id: action.edgeData.id,
          campaign_id: action.edgeData.campaign_id,
          user_id: action.edgeData.user_id,
          source_node_id: action.edgeData.source,
          target_node_id: action.edgeData.target,
          label: action.edgeData.label,
          connection_type: action.edgeData.connection_type,
        }).select().single();
        if (restoredEdge) {
          setEdges((eds) => [...eds, {
            id: restoredEdge.id,
            source: restoredEdge.source_node_id,
            target: restoredEdge.target_node_id,
            type: 'mindmap',
            data: { label: restoredEdge.label, connectionType: restoredEdge.connection_type || 'default' },
          }]);
        }
        break;
      }
      case 'update_node': {
        const oldData = action.oldData;
        const updatePayload: any = {};
        if (oldData.title !== undefined) updatePayload.title = oldData.title;
        if (oldData.content !== undefined) updatePayload.content = oldData.content;
        if (oldData.node_type !== undefined) updatePayload.node_type = oldData.node_type;
        if (oldData.color !== undefined) updatePayload.color = oldData.color;

        await supabase.from('mind_map_nodes').update(updatePayload).eq('id', action.nodeId);
        
        const current = nodeDataMap.get(action.nodeId);
        if (current) {
          const restored = { ...current, ...oldData };
          nodeDataMap.set(action.nodeId, restored);
          setNodeDataMap(new Map(nodeDataMap));
          setNodes((nds) => nds.map((n) =>
            n.id === action.nodeId ? { ...n, data: { ...n.data, label: restored.title, nodeData: restored } } : n
          ));
        }
        break;
      }
      case 'batch_create_nodes': {
        for (const nodeId of action.nodeIds) {
          await supabase.from('mind_map_connections').delete()
            .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);
          await supabase.from('mind_map_nodes').delete().eq('id', nodeId);
          nodeDataMap.delete(nodeId);
        }
        const idsSet = new Set(action.nodeIds);
        setNodes((nds) => nds.filter((n) => !idsSet.has(n.id)));
        setEdges((eds) => eds.filter((e) => !idsSet.has(e.source) && !idsSet.has(e.target)));
        setNodeDataMap(new Map(nodeDataMap));
        break;
      }
      case 'batch_delete_nodes': {
        for (const item of action.items) {
          const { data } = await supabase.from('mind_map_nodes').insert({
            id: item.nodeData.id,
            campaign_id: item.nodeData.campaign_id,
            user_id: item.nodeData.user_id,
            title: item.nodeData.title,
            content: item.nodeData.content,
            node_type: item.nodeData.node_type,
            color: item.nodeData.color,
            position_x: item.position.x,
            position_y: item.position.y,
            entity_id: item.nodeData.entity_id,
            entity_type: item.nodeData.entity_type,
          }).select().single();

          if (data) {
            const nd = data as MindMapNodeData;
            nodeDataMap.set(data.id, nd);
            setNodes((nds) => [...nds, {
              id: data.id, type: 'mindmap', position: item.position,
              data: { label: data.title, nodeData: nd, isSelected: false },
            }]);

            for (const edge of item.edges) {
              const { data: edgeData } = await supabase.from('mind_map_connections').insert({
                id: edge.id, campaign_id: edge.campaign_id, user_id: edge.user_id,
                source_node_id: edge.source, target_node_id: edge.target,
                label: edge.label, connection_type: edge.connectionType,
              }).select().single();
              if (edgeData) {
                setEdges((eds) => [...eds, {
                  id: edgeData.id, source: edgeData.source_node_id, target: edgeData.target_node_id,
                  type: 'mindmap', data: { label: edgeData.label, connectionType: edgeData.connection_type || 'default' },
                }]);
              }
            }
          }
        }
        setNodeDataMap(new Map(nodeDataMap));
        break;
      }
    }

    toast({ title: 'Desfeito!', description: 'Última ação foi revertida.' });
  }, [nodeDataMap, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Undo (Ctrl+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !isTyping) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Copy (Ctrl+C) - allow in inputs for normal copy behavior
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedNodeIds.size > 0 && !isTyping) {
        e.preventDefault();
        setCopiedNodeIds(Array.from(selectedNodeIds));
        toast({ title: 'Copiado!', description: `${selectedNodeIds.size} nó(s) copiado(s).` });
        return;
      }

      // Paste (Ctrl+V) - allow in inputs for normal paste behavior
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedNodeIds.length > 0 && !isTyping) {
        e.preventDefault();
        handlePasteNodes();
        return;
      }

      if (selectedNodeIds.size === 0) return;

      // Delete node(s) - only when not typing
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isTyping) {
        e.preventDefault();
        if (selectedNodeIds.size === 1) {
          handleConfirmDelete(Array.from(selectedNodeIds)[0]);
        } else {
          setIsBatchDeleteDialogOpen(true);
        }
      }

      // Duplicate node(s) (Ctrl+D) - only when not typing
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !isTyping) {
        e.preventDefault();
        if (selectedNodeIds.size === 1) {
          handleDuplicateNode(Array.from(selectedNodeIds)[0]);
        } else {
          handleBatchDuplicate();
        }
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNodeIds(new Set());
        updateNodeSelection(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, copiedNodeIds, nodeDataMap, handleUndo]);

  const updateNodeSelection = (nodeIds: Set<string>) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isSelected: nodeIds.has(n.id) },
      }))
    );
  };

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (event.shiftKey) {
      // Multi-select with Shift
      setSelectedNodeIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        updateNodeSelection(newSet);
        return newSet;
      });
    } else {
      // Single select
      const newSet = new Set([node.id]);
      setSelectedNodeIds(newSet);
      updateNodeSelection(newSet);
    }
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeIds(new Set());
    updateNodeSelection(new Set());
  }, []);

  // Edit node
  const handleEditNode = useCallback((nodeId: string) => {
    const nodeData = nodeDataMap.get(nodeId);
    if (nodeData) {
      setEditingNodeId(nodeId);
      setNodeTitle(nodeData.title);
      setNodeContent(nodeData.content || '');
      setNodeType((nodeData.node_type as NodeType) || 'idea');
      setIsNodeDialogOpen(true);
    }
  }, [nodeDataMap]);

  // Confirm delete
  const handleConfirmDelete = useCallback((nodeId: string) => {
    setNodeToDelete(nodeId);
    setIsDeleteDialogOpen(true);
  }, []);

  // Delete node
  const handleDeleteNode = async () => {
    if (!nodeToDelete || !activeCampaign) return;

    // Save undo data before deleting
    const deletedNodeData = nodeDataMap.get(nodeToDelete);
    const deletedNode = nodes.find((n) => n.id === nodeToDelete);
    const deletedEdges = edges
      .filter((e) => e.source === nodeToDelete || e.target === nodeToDelete)
      .map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: (e.data as any)?.label || null,
        connectionType: (e.data as any)?.connectionType || null,
      }));

    // Delete connections first
    await supabase
      .from('mind_map_connections')
      .delete()
      .or(`source_node_id.eq.${nodeToDelete},target_node_id.eq.${nodeToDelete}`);

    // Delete node
    const { error } = await supabase
      .from('mind_map_nodes')
      .delete()
      .eq('id', nodeToDelete);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
      return;
    }

    if (deletedNodeData && deletedNode) {
      pushAction({
        type: 'delete_node',
        nodeData: deletedNodeData,
        position: deletedNode.position,
        edges: deletedEdges,
      });
    }

    setNodes((nds) => nds.filter((n) => n.id !== nodeToDelete));
    setEdges((eds) => eds.filter((e) => e.source !== nodeToDelete && e.target !== nodeToDelete));
    nodeDataMap.delete(nodeToDelete);
    setNodeDataMap(new Map(nodeDataMap));
    setNodeToDelete(null);
    setSelectedNodeIds(new Set());
    setIsDeleteDialogOpen(false);

    toast({ title: 'Nó excluído!', description: 'O elemento foi removido do mapa.' });
  };

  // Duplicate node
  const handleDuplicateNode = async (nodeId: string) => {
    if (!activeCampaign || !user) return;

    const nodeData = nodeDataMap.get(nodeId);
    if (!nodeData) return;

    // Get current visual position from nodes state
    const currentNode = nodes.find(n => n.id === nodeId);
    const currentPosition = currentNode?.position || { x: nodeData.position_x || 0, y: nodeData.position_y || 0 };

    const newPosition = {
      x: currentPosition.x + 50,
      y: currentPosition.y + 50,
    };

    const { data, error } = await supabase
      .from('mind_map_nodes')
      .insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        title: `${nodeData.title} (cópia)`,
        content: nodeData.content,
        node_type: nodeData.node_type,
        position_x: newPosition.x,
        position_y: newPosition.y,
        color: nodeData.color,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao duplicar', description: error.message });
      return;
    }

    const newNodeData = data as MindMapNodeData;
    nodeDataMap.set(data.id, newNodeData);
    setNodeDataMap(new Map(nodeDataMap));

    const newNode: Node = {
      id: data.id,
      type: 'mindmap',
      position: newPosition,
      data: {
        label: data.title,
        nodeData: newNodeData,
        onEdit: handleEditNode,
        onDelete: handleConfirmDelete,
        onDuplicate: handleDuplicateNode,
        isSelected: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    pushAction({ type: 'create_node', nodeId: data.id });
    toast({ title: 'Nó duplicado!', description: `${data.title} foi criado.` });
  };

  // Batch duplicate multiple nodes
  const handleBatchDuplicate = async () => {
    if (!activeCampaign || !user || selectedNodeIds.size === 0) return;

    const nodeIdsArray = Array.from(selectedNodeIds);
    let successCount = 0;
    const createdIds: string[] = [];

    for (const nodeId of nodeIdsArray) {
      const nodeData = nodeDataMap.get(nodeId);
      if (!nodeData) continue;

      const currentNode = nodes.find(n => n.id === nodeId);
      const currentPosition = currentNode?.position || { x: nodeData.position_x || 0, y: nodeData.position_y || 0 };

      const newPosition = { x: currentPosition.x + 50, y: currentPosition.y + 50 };

      const { data, error } = await supabase
        .from('mind_map_nodes')
        .insert({
          campaign_id: activeCampaign.id, user_id: user.id,
          title: `${nodeData.title} (cópia)`, content: nodeData.content,
          node_type: nodeData.node_type, position_x: newPosition.x,
          position_y: newPosition.y, color: nodeData.color,
        })
        .select().single();

      if (!error && data) {
        const newNodeData = data as MindMapNodeData;
        nodeDataMap.set(data.id, newNodeData);
        createdIds.push(data.id);

        const newNode: Node = {
          id: data.id, type: 'mindmap', position: newPosition,
          data: { label: data.title, nodeData: newNodeData, onEdit: handleEditNode, onDelete: handleConfirmDelete, onDuplicate: handleDuplicateNode, isSelected: false },
        };
        setNodes((nds) => [...nds, newNode]);
        successCount++;
      }
    }

    if (createdIds.length > 0) {
      pushAction({ type: 'batch_create_nodes', nodeIds: createdIds });
    }
    setNodeDataMap(new Map(nodeDataMap));
    toast({ title: 'Nós duplicados!', description: `${successCount} nó(s) duplicado(s).` });
  };

  // Batch delete multiple nodes
  const handleBatchDelete = async () => {
    if (!activeCampaign || selectedNodeIds.size === 0) return;

    const nodeIdsArray = Array.from(selectedNodeIds);

    // Save undo data before deleting
    const undoItems = nodeIdsArray.map((nodeId) => {
      const nd = nodeDataMap.get(nodeId);
      const nodeEl = nodes.find((n) => n.id === nodeId);
      const nodeEdges = edges
        .filter((e) => e.source === nodeId || e.target === nodeId)
        .map((e) => ({
          id: e.id, source: e.source, target: e.target,
          label: (e.data as any)?.label || null,
          connectionType: (e.data as any)?.connectionType || null,
          campaign_id: nd?.campaign_id || activeCampaign.id,
          user_id: nd?.user_id || '',
        }));
      return {
        nodeData: nd!,
        position: nodeEl?.position || { x: nd?.position_x || 0, y: nd?.position_y || 0 },
        edges: nodeEdges,
      };
    }).filter((item) => item.nodeData);

    // Delete all connections first
    for (const nodeId of nodeIdsArray) {
      await supabase.from('mind_map_connections').delete()
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);
    }

    // Delete all nodes
    const { error } = await supabase.from('mind_map_nodes').delete().in('id', nodeIdsArray);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.message });
      return;
    }

    pushAction({ type: 'batch_delete_nodes', items: undoItems });

    setNodes((nds) => nds.filter((n) => !selectedNodeIds.has(n.id)));
    setEdges((eds) => eds.filter((e) => !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)));
    
    nodeIdsArray.forEach((id) => nodeDataMap.delete(id));
    setNodeDataMap(new Map(nodeDataMap));
    setSelectedNodeIds(new Set());

    toast({ title: 'Nós excluídos!', description: `${nodeIdsArray.length} nó(s) removido(s).` });
  };

  // Paste copied nodes
  const handlePasteNodes = async () => {
    if (!activeCampaign || !user || copiedNodeIds.length === 0) return;

    let successCount = 0;
    let offsetX = 100;
    const createdIds: string[] = [];

    for (const nodeId of copiedNodeIds) {
      const nodeData = nodeDataMap.get(nodeId);
      if (!nodeData) continue;

      const currentNode = nodes.find(n => n.id === nodeId);
      const currentPosition = currentNode?.position || { x: nodeData.position_x || 0, y: nodeData.position_y || 0 };

      const newPosition = { x: currentPosition.x + offsetX, y: currentPosition.y + 50 };

      const { data, error } = await supabase
        .from('mind_map_nodes')
        .insert({
          campaign_id: activeCampaign.id, user_id: user.id,
          title: `${nodeData.title} (cópia)`, content: nodeData.content,
          node_type: nodeData.node_type, position_x: newPosition.x,
          position_y: newPosition.y, color: nodeData.color,
        })
        .select().single();

      if (!error && data) {
        const newNodeData = data as MindMapNodeData;
        nodeDataMap.set(data.id, newNodeData);
        createdIds.push(data.id);

        const newNode: Node = {
          id: data.id, type: 'mindmap', position: newPosition,
          data: { label: data.title, nodeData: newNodeData, onEdit: handleEditNode, onDelete: handleConfirmDelete, onDuplicate: handleDuplicateNode, isSelected: false },
        };
        setNodes((nds) => [...nds, newNode]);
        successCount++;
        offsetX += 50;
      }
    }

    if (createdIds.length > 0) {
      pushAction({ type: 'batch_create_nodes', nodeIds: createdIds });
    }
    setNodeDataMap(new Map(nodeDataMap));
    toast({ title: 'Colado!', description: `${successCount} nó(s) colado(s).` });
  };

  // Add or update node
  const handleSubmitNode = async () => {
    if (!nodeTitle.trim() || !activeCampaign || !user) return;

    if (editingNodeId) {
      // Save old data for undo
      const oldNodeData = nodeDataMap.get(editingNodeId);
      // Update existing node
      const { error } = await supabase
        .from('mind_map_nodes')
        .update({
          title: nodeTitle,
          content: nodeContent,
          node_type: nodeType,
          color: NODE_TYPES[nodeType].color,
        })
        .eq('id', editingNodeId);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
        return;
      }

      const updatedData = {
        ...nodeDataMap.get(editingNodeId)!,
        title: nodeTitle,
        content: nodeContent,
        node_type: nodeType,
        color: NODE_TYPES[nodeType].color,
      };
      nodeDataMap.set(editingNodeId, updatedData);
      setNodeDataMap(new Map(nodeDataMap));

      setNodes((nds) =>
        nds.map((n) =>
          n.id === editingNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  label: nodeTitle,
                  nodeData: updatedData,
                },
              }
            : n
        )
      );

      if (oldNodeData) {
        pushAction({
          type: 'update_node',
          nodeId: editingNodeId,
          oldData: { title: oldNodeData.title, content: oldNodeData.content, node_type: oldNodeData.node_type, color: oldNodeData.color },
        });
      }

      toast({ title: 'Nó atualizado!', description: `${nodeTitle} foi salvo.` });
    } else {
      // Create new node
      const position = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };

      const { data, error } = await supabase
        .from('mind_map_nodes')
        .insert({
          campaign_id: activeCampaign.id,
          user_id: user.id,
          title: nodeTitle,
          content: nodeContent,
          node_type: nodeType,
          position_x: position.x,
          position_y: position.y,
          color: NODE_TYPES[nodeType].color,
        })
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao criar', description: error.message });
        return;
      }

      const newNodeData = data as MindMapNodeData;
      nodeDataMap.set(data.id, newNodeData);
      setNodeDataMap(new Map(nodeDataMap));

      const newNode: Node = {
        id: data.id,
        type: 'mindmap',
        position,
        data: {
          label: nodeTitle,
          nodeData: newNodeData,
          onEdit: handleEditNode,
          onDelete: handleConfirmDelete,
          onDuplicate: handleDuplicateNode,
          isSelected: false,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      pushAction({ type: 'create_node', nodeId: data.id });
      toast({ title: 'Nó criado!', description: `${nodeTitle} foi adicionado ao mapa.` });
    }

    resetNodeForm();
  };

  const resetNodeForm = () => {
    setNodeTitle('');
    setNodeContent('');
    setNodeType('idea');
    setEditingNodeId(null);
    setIsNodeDialogOpen(false);
  };

  // Create connection
  const onConnect = useCallback(
    async (params: Connection) => {
      if (!activeCampaign || !user || !params.source || !params.target) return;

      const { data, error } = await supabase
        .from('mind_map_connections')
        .insert({
          campaign_id: activeCampaign.id,
          user_id: user.id,
          source_node_id: params.source,
          target_node_id: params.target,
        })
        .select()
        .single();

      if (error) {
        toast({ variant: 'destructive', title: 'Erro ao conectar', description: error.message });
        return;
      }

      const newEdge: Edge = {
        id: data.id,
        source: params.source,
        target: params.target,
        type: 'mindmap',
        data: { connectionType: 'default' },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      pushAction({ type: 'create_edge', edgeId: data.id });
    },
    [activeCampaign, user, pushAction]
  );

  // Edit connection (single click on edge or via button)
  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingConnection(edge);
    setConnectionLabel((edge.data as any)?.label || '');
    setConnectionType((edge.data as any)?.connectionType || 'default');
    setIsConnectionDialogOpen(true);
  }, []);

  // Edit connection by id (from panel or hover button)
  const handleEditConnectionById = useCallback((edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;
    setEditingConnection(edge);
    setConnectionLabel((edge.data as any)?.label || '');
    setConnectionType((edge.data as any)?.connectionType || 'default');
    setIsConnectionDialogOpen(true);
  }, [edges]);

  // Delete connection
  const handleDeleteConnection = useCallback(async (edgeId: string) => {
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge || !activeCampaign || !user) return;

    // Save for undo
    pushAction({
      type: 'delete_edge',
      edgeData: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: (edge.data as any)?.label || null,
        connection_type: (edge.data as any)?.connectionType || null,
        campaign_id: activeCampaign.id,
        user_id: user.id,
      },
    });

    const { error } = await supabase
      .from('mind_map_connections')
      .delete()
      .eq('id', edgeId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir conexão', description: error.message });
      return;
    }

    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    toast({ title: 'Conexão excluída!' });
  }, [edges, activeCampaign, user, pushAction, toast]);

  // Update edge callbacks when handlers change
  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: {
          ...e.data,
          onEdit: handleEditConnectionById,
          onDelete: handleDeleteConnection,
        },
      }))
    );
  }, [handleEditConnectionById, handleDeleteConnection]);

  // Update connection style
  const handleSubmitConnection = async () => {
    if (!editingConnection) return;

    const { error } = await supabase
      .from('mind_map_connections')
      .update({
        label: connectionLabel || null,
        connection_type: connectionType,
      })
      .eq('id', editingConnection.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar', description: error.message });
      return;
    }

    setEdges((eds) =>
      eds.map((e) =>
        e.id === editingConnection.id
          ? { ...e, data: { ...e.data, label: connectionLabel, connectionType } }
          : e
      )
    );

    setEditingConnection(null);
    setConnectionLabel('');
    setConnectionType('default');
    setIsConnectionDialogOpen(false);

    toast({ title: 'Conexão atualizada!' });
  };

  // Import entities
  const handleImportEntities = async (
    entities: { type: 'npc' | 'location' | 'quest'; items: { id: string; name: string; description?: string | null }[] }[]
  ) => {
    if (!activeCampaign || !user) return;

    let xOffset = 100;
    const yBase = 100;
    const nodesToInsert: any[] = [];

    for (const group of entities) {
      const entityType = group.type;
      const nodeTypeMap = { npc: 'npc', location: 'location', quest: 'quest' };

      for (const item of group.items) {
        nodesToInsert.push({
          campaign_id: activeCampaign.id,
          user_id: user.id,
          title: item.name,
          content: item.description,
          node_type: nodeTypeMap[entityType],
          entity_id: item.id,
          entity_type: entityType,
          position_x: xOffset,
          position_y: yBase + Math.random() * 200,
          color: NODE_TYPES[nodeTypeMap[entityType] as NodeType].color,
        });
        xOffset += 180;
      }
    }

    const { data, error } = await supabase
      .from('mind_map_nodes')
      .insert(nodesToInsert)
      .select();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao importar', description: error.message });
      return;
    }

    const newNodes: Node[] = data.map((node) => {
      const nodeData = node as MindMapNodeData;
      nodeDataMap.set(node.id, nodeData);
      return {
        id: node.id,
        type: 'mindmap',
        position: { x: node.position_x || 0, y: node.position_y || 0 },
        data: {
          label: node.title,
          nodeData,
          onEdit: handleEditNode,
          onDelete: handleConfirmDelete,
          onDuplicate: handleDuplicateNode,
          isSelected: false,
        },
      };
    });

    setNodeDataMap(new Map(nodeDataMap));
    setNodes((nds) => [...nds, ...newNodes]);
    toast({ title: 'Entidades importadas!', description: `${data.length} nós foram adicionados.` });
  };

  // Import from JSON
  const handleImportJson = async (data: ImportJsonData) => {
    if (!activeCampaign || !user) return;

    // Calculate grid layout for nodes without positions
    const GRID_COLS = Math.ceil(Math.sqrt(data.nodes.length));
    const CELL_W = 250;
    const CELL_H = 180;
    const OFFSET_X = 100;
    const OFFSET_Y = 100;

    // Create all nodes first, mapping ref -> real UUID
    const refToId = new Map<string, string>();
    let autoIndex = 0;
    const nodesToInsert = data.nodes.map((n) => {
      const typeColor = NODE_TYPES[n.nodeType as NodeType]?.color || '#3b82f6';
      const hasPosition = n.position !== undefined && n.position !== null;
      const col = autoIndex % GRID_COLS;
      const row = Math.floor(autoIndex / GRID_COLS);
      autoIndex++;
      return {
        campaign_id: activeCampaign.id,
        user_id: user.id,
        title: n.title,
        content: n.content || null,
        node_type: n.nodeType,
        color: n.color || typeColor,
        position_x: hasPosition ? n.position!.x : OFFSET_X + col * CELL_W,
        position_y: hasPosition ? n.position!.y : OFFSET_Y + row * CELL_H,
      };
    });

    const { data: createdNodes, error: nodesError } = await supabase
      .from('mind_map_nodes')
      .insert(nodesToInsert)
      .select();

    if (nodesError || !createdNodes) {
      throw new Error(nodesError?.message || 'Erro ao criar nós');
    }

    // Map refs to real IDs (insertion order matches)
    data.nodes.forEach((n, i) => {
      refToId.set(n.ref, createdNodes[i].id);
    });

    // Add nodes to state
    const newNodes = createdNodes.map((node) => {
      const nd = node as MindMapNodeData;
      nodeDataMap.set(node.id, nd);
      return {
        id: node.id,
        type: 'mindmap' as const,
        position: { x: node.position_x || 0, y: node.position_y || 0 },
        data: {
          label: node.title,
          nodeData: nd,
          onEdit: handleEditNode,
          onDelete: handleConfirmDelete,
          onDuplicate: handleDuplicateNode,
          isSelected: false,
        },
      };
    });

    // Create connections
    if (data.connections.length > 0) {
      const connsToInsert = data.connections.map((c) => ({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        source_node_id: refToId.get(c.source)!,
        target_node_id: refToId.get(c.target)!,
        label: c.label || null,
        connection_type: c.connectionType || 'default',
      }));

      const { data: createdConns, error: connsError } = await supabase
        .from('mind_map_connections')
        .insert(connsToInsert)
        .select();

      if (connsError) {
        // Nodes were created but connections failed
        toast({ variant: 'destructive', title: 'Aviso', description: 'Nós criados, mas houve erro nas conexões: ' + connsError.message });
      }

      if (createdConns) {
        const newEdges = createdConns.map((conn) => ({
          id: conn.id,
          source: conn.source_node_id,
          target: conn.target_node_id,
          type: 'mindmap' as const,
          data: { label: conn.label, connectionType: conn.connection_type || 'default' },
        }));
        setEdges((eds) => [...eds, ...newEdges]);
      }
    }

    setNodeDataMap(new Map(nodeDataMap));
    setNodes((nds) => [...nds, ...newNodes]);
    pushAction({ type: 'batch_create_nodes', nodeIds: createdNodes.map((n) => n.id) });

    // Fit view after import
    setTimeout(() => reactFlowInstance.fitView({ padding: 0.2 }), 100);
  };

  // Save positions
  const handleSavePositions = async () => {
    if (!activeCampaign) return;
    setIsSaving(true);

    try {
      const updates = nodes.map((node) =>
        supabase
          .from('mind_map_nodes')
          .update({ position_x: node.position.x, position_y: node.position.y })
          .eq('id', node.id)
      );

      await Promise.all(updates);
      toast({ title: 'Layout salvo!', description: 'As posições foram atualizadas.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: 'Não foi possível salvar.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save position on drag stop
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleNodeDragStart = useCallback(
    (_event: unknown, node: Node) => {
      dragStartPos.current = { ...node.position };
    },
    []
  );

  const handleNodeDragStop = useCallback(
    async (_event: unknown, node: Node) => {
      if (dragStartPos.current) {
        pushAction({
          type: 'move_node',
          nodeId: node.id,
          oldPosition: dragStartPos.current,
          newPosition: { ...node.position },
        });
        dragStartPos.current = null;
      }
      await supabase
        .from('mind_map_nodes')
        .update({ position_x: node.position.x, position_y: node.position.y })
        .eq('id', node.id);
    },
    [pushAction]
  );

  // Zoom controls
  const handleZoomIn = () => reactFlowInstance.zoomIn();
  const handleZoomOut = () => reactFlowInstance.zoomOut();
  const handleFitView = () => reactFlowInstance.fitView({ padding: 0.2 });

  if (!activeCampaign) {
    return (
      <AppLayout title="Mapa Mental">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Selecione uma Campanha</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Para usar o mapa mental, primeiro selecione ou crie uma campanha.
          </p>
          <Button onClick={() => (window.location.href = '/campaigns')}>Ir para Campanhas</Button>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Mapa Mental - ${activeCampaign.name}`}
      actions={
        <MindMapToolbar
          onAddNode={() => {
            resetNodeForm();
            setIsNodeDialogOpen(true);
          }}
          onSaveLayout={handleSavePositions}
          onImportEntities={() => setIsEntityDialogOpen(true)}
          onImportJson={() => setIsImportJsonDialogOpen(true)}
          onExport={() => setIsExportDialogOpen(true)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onToggleConnections={() => setIsConnectionsPanelOpen((p) => !p)}
          isSaving={isSaving}
          hasNodes={nodes.length > 0}
          hasEdges={edges.length > 0}
          isConnectionsPanelOpen={isConnectionsPanelOpen}
        />
      }
    >
      <div ref={containerRef} className="relative h-[calc(100vh-12rem)] rounded-lg border border-border/50 overflow-hidden bg-card">
        {nodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center p-8"
          >
            <Network className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">Mapa Mental Vazio</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Comece adicionando nós para organizar suas ideias, NPCs, locais e conexões da campanha.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEntityDialogOpen(true)}>
                Importar Entidades
              </Button>
              <Button onClick={() => setIsNodeDialogOpen(true)}>Criar Primeiro Nó</Button>
            </div>
          </motion.div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={handleNodeDragStop}
            onPaneClick={handlePaneClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'mindmap' }}
            fitView
            snapToGrid
            snapGrid={[20, 20]}
            minZoom={0.1}
            maxZoom={3}
            deleteKeyCode={null} // We handle delete manually
            className="bg-background"
          >
            <Controls className="bg-card border border-border" />
            <MiniMap
              className="bg-card border border-border"
              nodeColor={(node) => (node.data as any)?.nodeData?.color || '#888'}
              pannable
              zoomable
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        )}

        {/* Connections Panel */}
        <ConnectionsPanel
          open={isConnectionsPanelOpen}
          onClose={() => setIsConnectionsPanelOpen(false)}
          edges={edges}
          nodeDataMap={nodeDataMap}
          onEdit={handleEditConnectionById}
          onDelete={handleDeleteConnection}
        />
      </div>

      {/* Node Dialog */}
      <NodeDialog
        open={isNodeDialogOpen}
        onOpenChange={(open) => {
          if (!open) resetNodeForm();
          setIsNodeDialogOpen(open);
        }}
        title={nodeTitle}
        content={nodeContent}
        nodeType={nodeType}
        onTitleChange={setNodeTitle}
        onContentChange={setNodeContent}
        onNodeTypeChange={setNodeType}
        onSubmit={handleSubmitNode}
        isEditing={!!editingNodeId}
      />

      {/* Connection Dialog */}
      <ConnectionDialog
        open={isConnectionDialogOpen}
        onOpenChange={setIsConnectionDialogOpen}
        label={connectionLabel}
        connectionType={connectionType}
        onLabelChange={setConnectionLabel}
        onConnectionTypeChange={setConnectionType}
        onSubmit={handleSubmitConnection}
      />

      {/* Entity Import Dialog */}
      <EntityImportDialog
        open={isEntityDialogOpen}
        onOpenChange={setIsEntityDialogOpen}
        campaignId={activeCampaign.id}
        onImport={handleImportEntities}
      />

      {/* JSON Import Dialog */}
      <ImportJsonDialog
        open={isImportJsonDialogOpen}
        onOpenChange={setIsImportJsonDialogOpen}
        onImport={handleImportJson}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Nó?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O nó e todas as suas conexões serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNode} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Confirmation */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedNodeIds.size} Nós?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os nós selecionados e suas conexões serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                handleBatchDelete();
                setIsBatchDeleteDialogOpen(false);
              }} 
              className="bg-destructive text-destructive-foreground"
            >
              Excluir Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        campaignName={activeCampaign.name}
        nodeDataMap={nodeDataMap}
        connections={edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: (e.data as any)?.label,
          connectionType: (e.data as any)?.connectionType,
        }))}
      />
    </AppLayout>
  );
}

export default function MindMap() {
  return (
    <ReactFlowProvider>
      <MindMapContent />
    </ReactFlowProvider>
  );
}
