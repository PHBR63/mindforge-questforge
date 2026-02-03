import { useCallback, useState, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save, Network, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const nodeColors: Record<string, string> = {
  idea: '#3b82f6',
  npc: '#22c55e',
  location: '#f59e0b',
  quest: '#ef4444',
  faction: '#8b5cf6',
  event: '#ec4899',
  item: '#06b6d4',
};

const nodeTypeLabels: Record<string, string> = {
  idea: 'Ideia',
  npc: 'NPC',
  location: 'Local',
  quest: 'Missão',
  faction: 'Facção',
  event: 'Evento',
  item: 'Item',
};

export default function MindMap() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newNode, setNewNode] = useState({
    title: '',
    content: '',
    node_type: 'idea',
  });

  // Load nodes and edges from database
  useEffect(() => {
    if (!activeCampaign) return;

    const loadMindMap = async () => {
      const { data: nodesData, error: nodesError } = await supabase
        .from('mind_map_nodes')
        .select('*')
        .eq('campaign_id', activeCampaign.id);

      if (nodesError) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar mapa',
          description: nodesError.message,
        });
        return;
      }

      const { data: connectionsData, error: connectionsError } = await supabase
        .from('mind_map_connections')
        .select('*')
        .eq('campaign_id', activeCampaign.id);

      if (connectionsError) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar conexões',
          description: connectionsError.message,
        });
        return;
      }

      const formattedNodes: Node[] = nodesData.map((node) => ({
        id: node.id,
        type: 'default',
        position: { x: node.position_x, y: node.position_y },
        data: {
          label: (
            <div className="text-center p-2">
              <div className="font-display font-bold text-sm">{node.title}</div>
              {node.content && (
                <div className="text-xs text-muted-foreground mt-1 max-w-32 truncate">
                  {node.content}
                </div>
              )}
              <div className="text-xs mt-1 opacity-70">
                {nodeTypeLabels[node.node_type] || node.node_type}
              </div>
            </div>
          ),
        },
        style: {
          background: nodeColors[node.node_type] || nodeColors.idea,
          color: 'white',
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '8px',
          minWidth: '120px',
        },
      }));

      const formattedEdges: Edge[] = connectionsData.map((conn) => ({
        id: conn.id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        label: conn.label || undefined,
        type: 'smoothstep',
        animated: conn.connection_type === 'causes',
        style: { stroke: '#888' },
      }));

      setNodes(formattedNodes);
      setEdges(formattedEdges);
    };

    loadMindMap();
  }, [activeCampaign, setNodes, setEdges, toast]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!activeCampaign || !user) return;

      const newEdge = addEdge(
        { ...params, type: 'smoothstep', style: { stroke: '#888' } },
        edges
      );
      setEdges(newEdge);

      // Save connection to database
      await supabase.from('mind_map_connections').insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        source_node_id: params.source,
        target_node_id: params.target,
      });
    },
    [edges, setEdges, activeCampaign, user]
  );

  const handleAddNode = async () => {
    if (!newNode.title.trim() || !activeCampaign || !user) return;

    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    const { data, error } = await supabase
      .from('mind_map_nodes')
      .insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        title: newNode.title,
        content: newNode.content,
        node_type: newNode.node_type,
        position_x: position.x,
        position_y: position.y,
        color: nodeColors[newNode.node_type],
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar nó',
        description: error.message,
      });
      return;
    }

    const newFlowNode: Node = {
      id: data.id,
      type: 'default',
      position,
      data: {
        label: (
          <div className="text-center p-2">
            <div className="font-display font-bold text-sm">{newNode.title}</div>
            {newNode.content && (
              <div className="text-xs text-muted-foreground mt-1 max-w-32 truncate">
                {newNode.content}
              </div>
            )}
            <div className="text-xs mt-1 opacity-70">
              {nodeTypeLabels[newNode.node_type]}
            </div>
          </div>
        ),
      },
      style: {
        background: nodeColors[newNode.node_type],
        color: 'white',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: '8px',
        minWidth: '120px',
      },
    };

    setNodes((nds) => [...nds, newFlowNode]);
    setNewNode({ title: '', content: '', node_type: 'idea' });
    setIsDialogOpen(false);

    toast({
      title: 'Nó criado!',
      description: `${newNode.title} foi adicionado ao mapa.`,
    });
  };

  const handleSavePositions = async () => {
    if (!activeCampaign) return;
    setIsSaving(true);

    try {
      for (const node of nodes) {
        await supabase
          .from('mind_map_nodes')
          .update({
            position_x: node.position.x,
            position_y: node.position.y,
          })
          .eq('id', node.id);
      }

      toast({
        title: 'Posições salvas!',
        description: 'O layout do mapa foi salvo.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as posições.',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
          <h2 className="font-display text-2xl font-bold mb-2">
            Selecione uma Campanha
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Para usar o mapa mental, primeiro selecione ou crie uma campanha na
            seção de campanhas.
          </p>
          <Button onClick={() => window.location.href = '/campaigns'}>
            Ir para Campanhas
          </Button>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Mapa Mental - ${activeCampaign.name}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSavePositions} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Layout'}
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Nó
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Adicionar Nó</DialogTitle>
                <DialogDescription>
                  Crie um novo elemento para o mapa mental
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Nome do elemento..."
                    value={newNode.title}
                    onChange={(e) =>
                      setNewNode({ ...newNode, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newNode.node_type}
                    onValueChange={(value) =>
                      setNewNode({ ...newNode, node_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(nodeTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: nodeColors[key] }}
                            />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Descrição (opcional)</Label>
                  <Textarea
                    id="content"
                    placeholder="Detalhes adicionais..."
                    value={newNode.content}
                    onChange={(e) =>
                      setNewNode({ ...newNode, content: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddNode}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="h-[calc(100vh-12rem)] rounded-lg border border-border/50 overflow-hidden bg-card">
        {nodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full text-center p-8"
          >
            <Network className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-bold mb-2">
              Mapa Mental Vazio
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Comece adicionando nós para organizar suas ideias, NPCs, locais e
              conexões da campanha.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Nó
            </Button>
          </motion.div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-background"
          >
            <Controls className="bg-card border border-border" />
            <MiniMap
              className="bg-card border border-border"
              nodeColor={(node) => node.style?.background as string || '#888'}
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        )}
      </div>
    </AppLayout>
  );
}
