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
import { Plus, Users, Search, AlertCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NPC {
  id: string;
  name: string;
  description: string | null;
  personality: string | null;
  motivation: string | null;
  secrets: string | null;
  appearance: string | null;
  location: string | null;
  faction: string | null;
  status: string;
  image_url: string | null;
  notes: string | null;
}

export default function NPCs() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    personality: '',
    motivation: '',
    appearance: '',
    location: '',
    faction: '',
    status: 'alive',
    secrets: '',
  });

  useEffect(() => {
    if (!activeCampaign) {
      setIsLoading(false);
      return;
    }
    loadNPCs();
  }, [activeCampaign]);

  const loadNPCs = async () => {
    if (!activeCampaign) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('npcs')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setNpcs(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !activeCampaign || !user) return;

    const { error } = await supabase.from('npcs').insert({
      ...formData,
      campaign_id: activeCampaign.id,
      user_id: user.id,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'NPC criado!', description: `${formData.name} foi adicionado.` });
      setFormData({
        name: '', description: '', personality: '', motivation: '',
        appearance: '', location: '', faction: '', status: 'alive', secrets: '',
      });
      setIsDialogOpen(false);
      loadNPCs();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('npcs').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'NPC removido' });
      loadNPCs();
    }
  };

  const filteredNPCs = npcs.filter((npc) =>
    npc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    npc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    npc.faction?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeCampaign) {
    return (
      <AppLayout title="NPCs">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <AlertCircle className="w-12 h-12 text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Selecione uma Campanha</h2>
          <p className="text-muted-foreground mb-6">
            Primeiro, selecione uma campanha para gerenciar seus NPCs.
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
      title="NPCs"
      actions={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar NPCs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo NPC
            </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Criar NPC</DialogTitle>
                <DialogDescription>
                  Adicione um novo personagem à sua campanha
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome do NPC"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      <SelectItem value="alive">Vivo</SelectItem>
                      <SelectItem value="dead">Morto</SelectItem>
                      <SelectItem value="unknown">Desconhecido</SelectItem>
                      <SelectItem value="missing">Desaparecido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Uma breve descrição..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aparência</Label>
                  <Textarea
                    placeholder="Características físicas..."
                    value={formData.appearance}
                    onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Personalidade</Label>
                  <Textarea
                    placeholder="Traços de personalidade..."
                    value={formData.personality}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Motivação</Label>
                  <Input
                    placeholder="O que move este personagem?"
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input
                    placeholder="Onde encontrar?"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facção</Label>
                  <Input
                    placeholder="Grupo ou organização"
                    value={formData.faction}
                    onChange={(e) => setFormData({ ...formData, faction: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Segredos (só para o mestre)</Label>
                  <Input
                    placeholder="Segredos ocultos..."
                    value={formData.secrets}
                    onChange={(e) => setFormData({ ...formData, secrets: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Criar NPC</Button>
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
      ) : filteredNPCs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Users className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            {searchTerm ? 'Nenhum NPC encontrado' : 'Nenhum NPC ainda'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente outra busca' : 'Comece criando personagens para sua campanha'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro NPC
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNPCs.map((npc, index) => (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-lg">{npc.name}</CardTitle>
                    {npc.faction && (
                      <CardDescription>{npc.faction}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={npc.status === 'alive' ? 'default' : 'secondary'}>
                      {npc.status === 'alive' ? 'Vivo' : 
                       npc.status === 'dead' ? 'Morto' : 
                       npc.status === 'missing' ? 'Desaparecido' : 'Desconhecido'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(npc.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {npc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{npc.description}</p>
                  )}
                  {npc.location && (
                    <p className="text-xs text-muted-foreground">📍 {npc.location}</p>
                  )}
                  {npc.personality && (
                    <p className="text-xs text-muted-foreground">🎭 {npc.personality}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
