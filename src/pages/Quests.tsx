import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Swords, Search, AlertCircle, MoreVertical, Trash2, Edit, Gift, User, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Quest {
  id: string;
  title: string;
  description: string | null;
  objectives: string | null;
  rewards: string | null;
  quest_giver: string | null;
  status: string;
  priority: string;
  notes: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: typeof Clock }> = {
  available: { label: 'Disponível', variant: 'outline', icon: Clock },
  active: { label: 'Em Progresso', variant: 'default', icon: Swords },
  completed: { label: 'Concluída', variant: 'secondary', icon: CheckCircle2 },
  failed: { label: 'Fracassada', variant: 'destructive', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-muted-foreground' },
  normal: { label: 'Normal', color: 'text-foreground' },
  high: { label: 'Alta', color: 'text-amber-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
};

export default function Quests() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    rewards: '',
    quest_giver: '',
    status: 'available',
    priority: 'normal',
    notes: '',
  });

  useEffect(() => {
    if (!activeCampaign) {
      setIsLoading(false);
      return;
    }
    loadQuests();
  }, [activeCampaign]);

  const loadQuests = async () => {
    if (!activeCampaign) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setQuests(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      objectives: '',
      rewards: '',
      quest_giver: '',
      status: 'available',
      priority: 'normal',
      notes: '',
    });
    setEditingQuest(null);
  };

  const openEditDialog = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description || '',
      objectives: quest.objectives || '',
      rewards: quest.rewards || '',
      quest_giver: quest.quest_giver || '',
      status: quest.status,
      priority: quest.priority,
      notes: quest.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !activeCampaign || !user) return;

    if (editingQuest) {
      const { error } = await supabase
        .from('quests')
        .update(formData)
        .eq('id', editingQuest.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Missão atualizada!', description: `${formData.title} foi atualizada.` });
        resetForm();
        setIsDialogOpen(false);
        loadQuests();
      }
    } else {
      const { error } = await supabase.from('quests').insert({
        ...formData,
        campaign_id: activeCampaign.id,
        user_id: user.id,
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Missão criada!', description: `${formData.title} foi adicionada.` });
        resetForm();
        setIsDialogOpen(false);
        loadQuests();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('quests').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Missão removida' });
      loadQuests();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('quests').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Status atualizado' });
      loadQuests();
    }
  };

  const filteredQuests = quests.filter((quest) => {
    const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quest.quest_giver?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || quest.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!activeCampaign) {
    return (
      <AppLayout title="Missões">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <AlertCircle className="w-12 h-12 text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Selecione uma Campanha</h2>
          <p className="text-muted-foreground mb-6">
            Primeiro, selecione uma campanha para gerenciar suas missões.
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
      title="Missões"
      actions={
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar missões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-36 md:w-48"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32 md:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="available">Disponíveis</SelectItem>
              <SelectItem value="active">Em Progresso</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="failed">Fracassadas</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Missão
            </Button>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingQuest ? 'Editar Missão' : 'Criar Missão'}
                </DialogTitle>
                <DialogDescription>
                  {editingQuest ? 'Atualize as informações da missão' : 'Adicione uma nova missão à sua campanha'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Nome da missão"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="active">Em Progresso</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="failed">Fracassada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva a missão..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Objetivos</Label>
                  <Textarea
                    placeholder="Liste os objetivos da missão..."
                    value={formData.objectives}
                    onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quem deu a missão?</Label>
                  <Input
                    placeholder="NPC ou organização"
                    value={formData.quest_giver}
                    onChange={(e) => setFormData({ ...formData, quest_giver: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recompensas</Label>
                  <Input
                    placeholder="Ouro, itens, favores..."
                    value={formData.rewards}
                    onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Notas do Mestre</Label>
                  <Textarea
                    placeholder="Anotações secretas..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="w-full sm:w-auto">
                  {editingQuest ? 'Salvar' : 'Criar Missão'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader>
              <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredQuests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Swords className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            {searchTerm || filterStatus !== 'all' ? 'Nenhuma missão encontrada' : 'Nenhuma missão ainda'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all' ? 'Tente outros filtros' : 'Comece criando missões épicas para sua campanha'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Missão
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuests.map((quest, index) => {
            const status = statusConfig[quest.status] || statusConfig.available;
            const priority = priorityConfig[quest.priority] || priorityConfig.normal;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:border-primary/50 transition-all">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-display text-lg">{quest.title}</CardTitle>
                        <span className={`text-xs font-medium ${priority.color}`}>
                          ({priority.label})
                        </span>
                      </div>
                      {quest.quest_giver && (
                        <CardDescription className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {quest.quest_giver}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(quest)}>
                          <Edit className="w-4 h-4 mr-2" />Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(quest.id, 'active')}>
                          <Swords className="w-4 h-4 mr-2" />Marcar Em Progresso
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(quest.id, 'completed')}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />Marcar Concluída
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(quest.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </Badge>
                    {quest.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{quest.description}</p>
                    )}
                    {quest.objectives && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Objetivos:</span> {quest.objectives}
                      </div>
                    )}
                    {quest.rewards && (
                      <p className="text-xs text-amber-500 flex items-center gap-1.5">
                        <Gift className="w-3 h-3" /> {quest.rewards}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
