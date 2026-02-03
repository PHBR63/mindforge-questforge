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
import { ImageUpload } from '@/components/ui/image-upload';
import { Plus, Shield, Search, AlertCircle, MoreVertical, Trash2, Edit, Users, Target, Handshake, Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Faction {
  id: string;
  name: string;
  description: string | null;
  leader: string | null;
  headquarters: string | null;
  goals: string | null;
  allies: string | null;
  enemies: string | null;
  symbol_url: string | null;
}

export default function Factions() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [factions, setFactions] = useState<Faction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState<Faction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '',
    headquarters: '',
    goals: '',
    allies: '',
    enemies: '',
    symbol_url: null as string | null,
  });

  useEffect(() => {
    if (!activeCampaign) {
      setIsLoading(false);
      return;
    }
    loadFactions();
  }, [activeCampaign]);

  const loadFactions = async () => {
    if (!activeCampaign) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('factions')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setFactions(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      leader: '',
      headquarters: '',
      goals: '',
      allies: '',
      enemies: '',
      symbol_url: null,
    });
    setEditingFaction(null);
  };

  const openEditDialog = (faction: Faction) => {
    setEditingFaction(faction);
    setFormData({
      name: faction.name,
      description: faction.description || '',
      leader: faction.leader || '',
      headquarters: faction.headquarters || '',
      goals: faction.goals || '',
      allies: faction.allies || '',
      enemies: faction.enemies || '',
      symbol_url: faction.symbol_url,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !activeCampaign || !user) return;

    if (editingFaction) {
      const { error } = await supabase
        .from('factions')
        .update(formData)
        .eq('id', editingFaction.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Facção atualizada!', description: `${formData.name} foi atualizada.` });
        resetForm();
        setIsDialogOpen(false);
        loadFactions();
      }
    } else {
      const { error } = await supabase.from('factions').insert({
        ...formData,
        campaign_id: activeCampaign.id,
        user_id: user.id,
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        toast({ title: 'Facção criada!', description: `${formData.name} foi adicionada.` });
        resetForm();
        setIsDialogOpen(false);
        loadFactions();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('factions').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Facção removida' });
      loadFactions();
    }
  };

  const filteredFactions = factions.filter((faction) =>
    faction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faction.leader?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeCampaign) {
    return (
      <AppLayout title="Facções">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <AlertCircle className="w-12 h-12 text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Selecione uma Campanha</h2>
          <p className="text-muted-foreground mb-6">
            Primeiro, selecione uma campanha para gerenciar suas facções.
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
      title="Facções"
      actions={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facções..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Facção
            </Button>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {editingFaction ? 'Editar Facção' : 'Criar Facção'}
                </DialogTitle>
                <DialogDescription>
                  {editingFaction ? 'Atualize as informações da facção' : 'Adicione uma nova organização à sua campanha'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Symbol Upload */}
                <div className="col-span-2">
                  <ImageUpload
                    value={formData.symbol_url}
                    onChange={(url) => setFormData({ ...formData, symbol_url: url })}
                    label="Símbolo/Brasão da Facção"
                    placeholder="Arraste uma imagem ou clique para selecionar"
                    aspectRatio="square"
                    resourceType="faction"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome da facção"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Líder</Label>
                  <Input
                    placeholder="Quem lidera?"
                    value={formData.leader}
                    onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva a facção..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sede / Quartel General</Label>
                  <Input
                    placeholder="Onde se localizam?"
                    value={formData.headquarters}
                    onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objetivos</Label>
                  <Input
                    placeholder="O que buscam?"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aliados</Label>
                  <Textarea
                    placeholder="Quem são seus aliados?"
                    value={formData.allies}
                    onChange={(e) => setFormData({ ...formData, allies: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inimigos</Label>
                  <Textarea
                    placeholder="Quem são seus inimigos?"
                    value={formData.enemies}
                    onChange={(e) => setFormData({ ...formData, enemies: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingFaction ? 'Salvar' : 'Criar Facção'}
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
      ) : filteredFactions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            {searchTerm ? 'Nenhuma facção encontrada' : 'Nenhuma facção ainda'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente outra busca' : 'Comece criando organizações para sua campanha'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Facção
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFactions.map((faction, index) => (
            <motion.div
              key={faction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-display text-lg">{faction.name}</CardTitle>
                      {faction.leader && (
                        <CardDescription className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {faction.leader}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(faction)}>
                        <Edit className="w-4 h-4 mr-2" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(faction.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-3">
                  {faction.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{faction.description}</p>
                  )}
                  <div className="space-y-1.5">
                    {faction.headquarters && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="text-primary">📍</span> {faction.headquarters}
                      </p>
                    )}
                    {faction.goals && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-primary" /> {faction.goals}
                      </p>
                    )}
                    {faction.allies && (
                      <p className="text-xs text-green-500 flex items-center gap-1.5">
                        <Handshake className="w-3 h-3" /> {faction.allies}
                      </p>
                    )}
                    {faction.enemies && (
                      <p className="text-xs text-red-500 flex items-center gap-1.5">
                        <Swords className="w-3 h-3" /> {faction.enemies}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
