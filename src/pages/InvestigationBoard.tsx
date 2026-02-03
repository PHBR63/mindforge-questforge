import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { BoardCanvas } from '@/components/investigation/BoardCanvas';
import { CluePanel } from '@/components/investigation/CluePanel';
import { 
  InvestigationBoard as BoardType, 
  InvestigationClue, 
  InvestigationConnection 
} from '@/components/investigation/types';
import { Plus, Search, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvestigationBoard() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const [boards, setBoards] = useState<BoardType[]>([]);
  const [activeBoard, setActiveBoard] = useState<BoardType | null>(null);
  const [clues, setClues] = useState<InvestigationClue[]>([]);
  const [connections, setConnections] = useState<InvestigationConnection[]>([]);
  const [selectedClueId, setSelectedClueId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Load boards
  useEffect(() => {
    if (!activeCampaign) return;

    const loadBoards = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('investigation_boards')
        .select('*')
        .eq('campaign_id', activeCampaign.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar quadros',
          description: error.message,
        });
      } else {
        setBoards(data as BoardType[]);
        if (data.length > 0 && !activeBoard) {
          setActiveBoard(data[0] as BoardType);
        }
      }
      setIsLoading(false);
    };

    loadBoards();
  }, [activeCampaign, toast]);

  // Load clues and connections when board changes
  useEffect(() => {
    if (!activeBoard) {
      setClues([]);
      setConnections([]);
      return;
    }

    const loadBoardData = async () => {
      const [cluesResult, connectionsResult] = await Promise.all([
        supabase
          .from('investigation_clues')
          .select('*')
          .eq('board_id', activeBoard.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('investigation_connections')
          .select('*')
          .eq('board_id', activeBoard.id),
      ]);

      if (cluesResult.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar pistas',
          description: cluesResult.error.message,
        });
      } else {
        setClues(cluesResult.data as InvestigationClue[]);
      }

      if (connectionsResult.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar conexões',
          description: connectionsResult.error.message,
        });
      } else {
        setConnections(connectionsResult.data as InvestigationConnection[]);
      }
    };

    loadBoardData();
  }, [activeBoard, toast]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !activeCampaign || !user) return;

    const { data, error } = await supabase
      .from('investigation_boards')
      .insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        name: newBoardName,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar quadro',
        description: error.message,
      });
      return;
    }

    const newBoard = data as BoardType;
    setBoards([newBoard, ...boards]);
    setActiveBoard(newBoard);
    setNewBoardName('');
    setIsCreateDialogOpen(false);

    toast({
      title: 'Quadro criado!',
      description: `${newBoardName} foi criado com sucesso.`,
    });
  };

  const handleDeleteBoard = async () => {
    if (!activeBoard) return;

    const { error } = await supabase
      .from('investigation_boards')
      .delete()
      .eq('id', activeBoard.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir quadro',
        description: error.message,
      });
      return;
    }

    const remaining = boards.filter((b) => b.id !== activeBoard.id);
    setBoards(remaining);
    setActiveBoard(remaining[0] || null);
    setClues([]);
    setConnections([]);

    toast({
      title: 'Quadro excluído',
      description: 'O quadro foi removido.',
    });
  };

  const handleClueCreate = async (
    clueData: Omit<InvestigationClue, 'id' | 'board_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!activeBoard || !user) return;

    const { data, error } = await supabase
      .from('investigation_clues')
      .insert({
        board_id: activeBoard.id,
        user_id: user.id,
        ...clueData,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar pista',
        description: error.message,
      });
      return;
    }

    setClues([...clues, data as InvestigationClue]);
    toast({
      title: 'Pista adicionada!',
      description: `${clueData.title} foi adicionada ao quadro.`,
    });
  };

  const handleClueMove = async (id: string, x: number, y: number) => {
    setClues(clues.map((c) => (c.id === id ? { ...c, position_x: x, position_y: y } : c)));

    await supabase
      .from('investigation_clues')
      .update({ position_x: x, position_y: y })
      .eq('id', id);
  };

  const handleClueUpdate = async (id: string, updates: Partial<InvestigationClue>) => {
    setClues(clues.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    const { error } = await supabase
      .from('investigation_clues')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar pista',
        description: error.message,
      });
    }
  };

  const handleClueDelete = async (id: string) => {
    const { error } = await supabase
      .from('investigation_clues')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir pista',
        description: error.message,
      });
      return;
    }

    setClues(clues.filter((c) => c.id !== id));
    setConnections(connections.filter((c) => c.source_clue_id !== id && c.target_clue_id !== id));
  };

  const handleConnectionCreate = async (sourceId: string, targetId: string) => {
    if (!activeBoard || !user) return;

    // Check if connection already exists
    const exists = connections.some(
      (c) =>
        (c.source_clue_id === sourceId && c.target_clue_id === targetId) ||
        (c.source_clue_id === targetId && c.target_clue_id === sourceId)
    );

    if (exists) return;

    const { data, error } = await supabase
      .from('investigation_connections')
      .insert({
        board_id: activeBoard.id,
        user_id: user.id,
        source_clue_id: sourceId,
        target_clue_id: targetId,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar conexão',
        description: error.message,
      });
      return;
    }

    setConnections([...connections, data as InvestigationConnection]);
    setIsConnecting(false);
  };

  const handleConnectionDelete = async (id: string) => {
    const { error } = await supabase
      .from('investigation_connections')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir conexão',
        description: error.message,
      });
      return;
    }

    setConnections(connections.filter((c) => c.id !== id));
  };

  if (!activeCampaign) {
    return (
      <AppLayout title="Quadro de Investigação">
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
            Para usar o quadro de investigação, primeiro selecione ou crie uma campanha.
          </p>
          <Button onClick={() => (window.location.href = '/campaigns')}>
            Ir para Campanhas
          </Button>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Quadro de Investigação - ${activeCampaign.name}`}
      actions={
        <div className="flex gap-2">
          <Select
            value={activeBoard?.id || ''}
            onValueChange={(id) => {
              const board = boards.find((b) => b.id === id);
              setActiveBoard(board || null);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um quadro" />
            </SelectTrigger>
            <SelectContent>
              {boards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="glow-gold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Quadro
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse text-primary font-display text-xl">
            Carregando...
          </div>
        </div>
      ) : activeBoard ? (
        <div className="flex h-[calc(100vh-12rem)] gap-0 -mx-6 -mb-6">
          <BoardCanvas
            clues={clues}
            connections={connections}
            selectedClueId={selectedClueId}
            onClueSelect={setSelectedClueId}
            onClueMove={handleClueMove}
            onConnectionCreate={handleConnectionCreate}
            onConnectionDelete={handleConnectionDelete}
            backgroundColor={activeBoard.background_color || '#1a1a1a'}
          />
          <CluePanel
            clues={clues}
            selectedClueId={selectedClueId}
            onClueCreate={handleClueCreate}
            onClueUpdate={handleClueUpdate}
            onClueDelete={handleClueDelete}
            onClueSelect={setSelectedClueId}
            onStartConnection={() => setIsConnecting(true)}
            isConnecting={isConnecting}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Search className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            Nenhum Quadro Criado
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Crie seu primeiro quadro de investigação para começar a conectar pistas e resolver mistérios.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Quadro
          </Button>
        </motion.div>
      )}

      {activeBoard && (
        <div className="flex justify-end mt-4">
          <Button variant="destructive" size="sm" onClick={handleDeleteBoard}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Quadro
          </Button>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Novo Quadro de Investigação</DialogTitle>
            <DialogDescription>
              Crie um novo quadro para sua investigação
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Nome do Quadro</Label>
              <Input
                placeholder="Ex: O Caso do Museu Abandonado"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBoard}>Criar Quadro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
