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
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, AlertCircle, MoreVertical, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TimelineEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  era: string | null;
  importance: string;
  category: string;
  is_secret: boolean;
  order_index: number;
}

export default function Timeline() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    era: '',
    importance: 'normal',
    category: 'world',
    is_secret: false,
  });

  useEffect(() => {
    if (!activeCampaign) {
      setIsLoading(false);
      return;
    }
    loadEvents();
  }, [activeCampaign]);

  const loadEvents = async () => {
    if (!activeCampaign) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('order_index');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setEvents(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !activeCampaign || !user) return;

    const { error } = await supabase.from('timeline_events').insert({
      ...formData,
      campaign_id: activeCampaign.id,
      user_id: user.id,
      order_index: events.length,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Evento criado!', description: `${formData.title} foi adicionado à linha do tempo.` });
      setFormData({
        title: '', description: '', event_date: '', era: '',
        importance: 'normal', category: 'world', is_secret: false,
      });
      setIsDialogOpen(false);
      loadEvents();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('timeline_events').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Evento removido' });
      loadEvents();
    }
  };

  const filteredEvents = showSecrets ? events : events.filter(e => !e.is_secret);

  const importanceColors: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    normal: 'bg-primary/20 text-primary',
    high: 'bg-gold/20 text-gold',
    critical: 'bg-blood/20 text-blood',
  };

  const categoryLabels: Record<string, string> = {
    world: 'Mundo',
    campaign: 'Campanha',
    player: 'Jogadores',
    secret: 'Segredo',
  };

  if (!activeCampaign) {
    return (
      <AppLayout title="Linha do Tempo">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <AlertCircle className="w-12 h-12 text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Selecione uma Campanha</h2>
          <Button onClick={() => window.location.href = '/campaigns'}>
            Ir para Campanhas
          </Button>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Linha do Tempo"
      actions={
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 mr-4">
            <Switch checked={showSecrets} onCheckedChange={setShowSecrets} />
            <Label className="text-sm">
              {showSecrets ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Label>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Evento
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Adicionar Evento</DialogTitle>
                <DialogDescription>
                  Crie um novo marco na história
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Nome do evento"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data/Período</Label>
                    <Input
                      placeholder="Ano 1453, Era dos Dragões..."
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Era</Label>
                    <Input
                      placeholder="Era das Trevas..."
                      value={formData.era}
                      onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="O que aconteceu..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Importância</Label>
                    <Select value={formData.importance} onValueChange={(v) => setFormData({ ...formData, importance: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="world">Mundo</SelectItem>
                        <SelectItem value="campaign">Campanha</SelectItem>
                        <SelectItem value="player">Jogadores</SelectItem>
                        <SelectItem value="secret">Segredo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_secret} onCheckedChange={(v) => setFormData({ ...formData, is_secret: v })} />
                  <Label>Evento secreto (só visível para o mestre)</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Criar Evento</Button>
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
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Clock className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">Linha do Tempo Vazia</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando eventos históricos</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Evento
          </Button>
        </motion.div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-16"
              >
                <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-background ${importanceColors[event.importance]}`} />
                <Card className={`${event.is_secret ? 'border-arcane/50 bg-arcane/5' : ''}`}>
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {event.event_date && (
                          <Badge variant="outline" className="text-xs">
                            {event.event_date}
                          </Badge>
                        )}
                        {event.era && (
                          <Badge variant="secondary" className="text-xs">
                            {event.era}
                          </Badge>
                        )}
                        {event.is_secret && (
                          <Badge className="bg-arcane/20 text-arcane text-xs">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Secreto
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-display text-lg">{event.title}</CardTitle>
                      <CardDescription>{categoryLabels[event.category]}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  {event.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
