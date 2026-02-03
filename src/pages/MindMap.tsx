import { useCallback, useState, useEffect, useRef } from 'react';
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
  EntityImportDialog,
  MindMapToolbar,
  ExportDialog,
  NODE_TYPES,
  CONNECTION_TYPES,
  MindMapNodeData,
  NodeType,
  ConnectionType,
} from '@/components/mindmap';

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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

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
          onEdit: handleEditNode,
          onDelete: handleConfirmDelete,
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedNodeId) return;

      // Delete node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleConfirmDelete(selectedNodeId);
      }

      // Duplicate node (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateNode(selectedNodeId);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        updateNodeSelection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, nodeDataMap]);

  const updateNodeSelection = (nodeId: string | null) => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, isSelected: n.id === nodeId },
      }))
    );
  };

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    updateNodeSelection(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    updateNodeSelection(null);
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

    setNodes((nds) => nds.filter((n) => n.id !== nodeToDelete));
    setEdges((eds) => eds.filter((e) => e.source !== nodeToDelete && e.target !== nodeToDelete));
    nodeDataMap.delete(nodeToDelete);
    setNodeDataMap(new Map(nodeDataMap));
    setNodeToDelete(null);
    setSelectedNodeId(null);
    setIsDeleteDialogOpen(false);

    toast({ title: 'Nó excluído!', description: 'O elemento foi removido do mapa.' });
  };

  // Duplicate node
  const handleDuplicateNode = async (nodeId: string) => {
    if (!activeCampaign || !user) return;

    const nodeData = nodeDataMap.get(nodeId);
    if (!nodeData) return;

    const newPosition = {
      x: (nodeData.position_x || 0) + 50,
      y: (nodeData.position_y || 0) + 50,
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
        isSelected: false,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    toast({ title: 'Nó duplicado!', description: `${data.title} foi criado.` });
  };

  // Add or update node
  const handleSubmitNode = async () => {
    if (!nodeTitle.trim() || !activeCampaign || !user) return;

    if (editingNodeId) {
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
          isSelected: false,
        },
      };

      setNodes((nds) => [...nds, newNode]);
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
    },
    [activeCampaign, user]
  );

  // Edit connection (double click)
  const handleEdgeDoubleClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingConnection(edge);
    setConnectionLabel((edge.data as any)?.label || '');
    setConnectionType((edge.data as any)?.connectionType || 'default');
    setIsConnectionDialogOpen(true);
  }, []);

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
          ? { ...e, data: { label: connectionLabel, connectionType } }
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
          isSelected: false,
        },
      };
    });

    setNodeDataMap(new Map(nodeDataMap));
    setNodes((nds) => [...nds, ...newNodes]);
    toast({ title: 'Entidades importadas!', description: `${data.length} nós foram adicionados.` });
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
          onExport={() => setIsExportDialogOpen(true)}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          isSaving={isSaving}
          hasNodes={nodes.length > 0}
        />
      }
    >
      <div ref={containerRef} className="h-[calc(100vh-12rem)] rounded-lg border border-border/50 overflow-hidden bg-card">
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
            onPaneClick={handlePaneClick}
            onEdgeDoubleClick={handleEdgeDoubleClick}
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
