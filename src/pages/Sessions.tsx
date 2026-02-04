import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, Search, AlertCircle, MoreVertical, Trash2, Edit, Play, CheckCircle, Clock, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  session_number: number;
  title: string;
  session_date: string | null;
  status: string;
  planned_content: string | null;
  actual_events: string | null;
  summary: string | null;
  notes: string | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof Clock }> = {
  planned: { label: 'Planejada', variant: 'outline', icon: Clock },
  in_progress: { label: 'Em Andamento', variant: 'default', icon: Play },
  completed: { label: 'Concluída', variant: 'secondary', icon: CheckCircle },
};

export default function Sessions() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState({
    session_number: 1,
    title: '',
    session_date: '',
    status: 'planned',
    planned_content: '',
    actual_events: '',
    summary: '',
    notes: '',
  });

  useEffect(() => {
    if (!activeCampaign) {
      setIsLoading(false);
      return;
    }
    loadSessions();
  }, [activeCampaign]);

  const loadSessions = async () => {
    if (!activeCampaign) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('session_number', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setSessions(data || []);
      // Auto-increment session number for new sessions
      if (data && data.length > 0) {
        const maxNumber = Math.max(...data.map(s => s.session_number));
        setFormData(prev => ({ ...prev, session_number: maxNumber + 1 }));
      }
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    const nextNumber = sessions.length > 0 
      ? Math.max(...sessions.map(s => s.session_number)) + 1 
      : 1;
    setFormData({
      session_number: nextNumber,
      title: '',
      session_date: '',
      status: 'planned',
      planned_content: '',
      actual_events: '',
      summary: '',
      notes: '',
    });
    setSelectedDate(undefined);
    setEditingSession(null);
  };

  const openEditDialog = (session: Session) => {
    setEditingSession(session);
    setFormData({
      session_number: session.session_number,
      title: session.title,
      session_date: session.session_date || '',
      status: session.status,
      planned_content: session.planned_content || '',
      actual_events: session.actual_events || '',
      summary: session.summary || '',
      notes: session.notes || '',
    });
    setSelectedDate(session.session_date ? new Date(session.session_date) : undefined);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !activeCampaign || !user) return;

    const payload = {
      ...formData,
      session_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
    };

    if (editingSession) {
      const { error } = await supabase
        .from('sessions')
        .update(payload)
        .eq('id', editingSession.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Sessão atualizada!', description: `${formData.title} foi atualizada.` });
        resetForm();
        setIsDialogOpen(false);
        loadSessions();
      }
    } else {
      const { error } = await supabase.from('sessions').insert({
        ...payload,
        campaign_id: activeCampaign.id,
        user_id: user.id,
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Sessão criada!', description: `${formData.title} foi adicionada.` });
        resetForm();
        setIsDialogOpen(false);
        loadSessions();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Sessão removida' });
      loadSessions();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('sessions').update({ status: newStatus }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Status atualizado' });
      loadSessions();
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeCampaign) {
    return (
      <AppLayout title="Sessões">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <AlertCircle className="w-12 h-12 text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Selecione uma Campanha</h2>
          <p className="text-muted-foreground mb-6">
            Primeiro, selecione uma campanha para gerenciar suas sessões.
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
      title="Sessões"
      actions={
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar sessões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-48 md:w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Sessão
            </Button>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingSession ? 'Editar Sessão' : 'Criar Sessão'}
                </DialogTitle>
                <DialogDescription>
                  {editingSession ? 'Atualize as informações da sessão' : 'Planeje sua próxima sessão de jogo'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 py-4">
                <div className="space-y-2">
                  <Label>Número da Sessão *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.session_number}
                    onChange={(e) => setFormData({ ...formData, session_number: parseInt(e.target.value) || 1 })}
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
                      <SelectItem value="planned">Planejada</SelectItem>
                      <SelectItem value="in_progress">Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Ex: A Cripta Esquecida"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Data da Sessão</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Conteúdo Planejado</Label>
                  <Textarea
                    placeholder="O que você planeja para esta sessão?"
                    value={formData.planned_content}
                    onChange={(e) => setFormData({ ...formData, planned_content: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Eventos Reais</Label>
                  <Textarea
                    placeholder="O que realmente aconteceu? (preencher após a sessão)"
                    value={formData.actual_events}
                    onChange={(e) => setFormData({ ...formData, actual_events: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Resumo</Label>
                  <Textarea
                    placeholder="Um breve resumo da sessão"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Notas do Mestre</Label>
                  <Textarea
                    placeholder="Anotações pessoais..."
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
                  {editingSession ? 'Salvar' : 'Criar Sessão'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 bg-muted rounded w-1/2" /></CardHeader>
              <CardContent><div className="h-16 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <CalendarIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            {searchTerm ? 'Nenhuma sessão encontrada' : 'Nenhuma sessão ainda'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente outra busca' : 'Comece planejando sua primeira sessão'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Sessão
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session, index) => {
            const status = statusConfig[session.status] || statusConfig.planned;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/50 transition-all">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 border border-primary/30">
                        <span className="text-xs text-muted-foreground">Sessão</span>
                        <span className="text-xl font-bold text-primary">{session.session_number}</span>
                      </div>
                      <div>
                        <CardTitle className="font-display text-lg">{session.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          {session.session_date && (
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" />
                              {format(new Date(session.session_date), "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                          )}
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(session)}>
                          <Edit className="w-4 h-4 mr-2" />Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(session.id, 'in_progress')}>
                          <Play className="w-4 h-4 mr-2" />Iniciar Sessão
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(session.id, 'completed')}>
                          <CheckCircle className="w-4 h-4 mr-2" />Marcar Concluída
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(session.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {session.summary && (
                      <p className="text-sm text-muted-foreground">{session.summary}</p>
                    )}
                    {session.planned_content && (
                      <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <FileText className="w-3 h-3 mt-0.5 text-primary" />
                        <span className="line-clamp-2">{session.planned_content}</span>
                      </div>
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
