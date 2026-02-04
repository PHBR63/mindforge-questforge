import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaigns, CreateCampaignInput } from '@/hooks/useCampaigns';
import { useCampaignContext } from '@/contexts/CampaignContext';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Scroll, Calendar, Users, Trash2, Edit, Play } from 'lucide-react';

const rpgSystems = [
  'D&D 5e',
  'Pathfinder 2e',
  'Call of Cthulhu',
  'Vampiro: A Máscara',
  'Tormenta 20',
  'Old Dragon',
  'Savage Worlds',
  'GURPS',
  'Outro',
];

export default function Campaigns() {
  const navigate = useNavigate();
  const { campaigns, isLoading, createCampaign, deleteCampaign } = useCampaigns();
  const { setActiveCampaign } = useCampaignContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: '',
    description: '',
    system: 'D&D 5e',
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    await createCampaign.mutateAsync(formData);
    setFormData({ name: '', description: '', system: 'D&D 5e' });
    setIsDialogOpen(false);
  };

  const handleSelectCampaign = (campaign: typeof campaigns[0]) => {
    setActiveCampaign(campaign);
    navigate('/mind-map');
  };

  return (
    <AppLayout
      title="Minhas Campanhas"
      actions={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-display glow-gold w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="font-display">Criar Nova Campanha</DialogTitle>
              <DialogDescription>
                Dê vida a uma nova aventura épica
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Campanha</Label>
                <Input
                  id="name"
                  placeholder="A Maldição de Strahd..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system">Sistema de RPG</Label>
                <Select
                  value={formData.system}
                  onValueChange={(value) => setFormData({ ...formData, system: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rpgSystems.map((system) => (
                      <SelectItem key={system} value={system}>
                        {system}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Uma breve descrição da sua campanha..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createCampaign.isPending} className="w-full sm:w-auto">
                {createCampaign.isPending ? 'Criando...' : 'Criar Campanha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Scroll className="w-12 h-12 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Nenhuma campanha ainda</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Comece sua jornada criando sua primeira campanha. 
            Organize NPCs, locais, missões e muito mais!
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Campanha
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign, index) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group hover:border-primary/50 transition-all duration-300 border-ornate cursor-pointer"
                    onClick={() => handleSelectCampaign(campaign)}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1">
                    <CardTitle className="font-display text-lg group-hover:text-primary transition-colors">
                      {campaign.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Scroll className="w-3 h-3" />
                      {campaign.system}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCampaign(campaign);
                      }}>
                        <Play className="w-4 h-4 mr-2" />
                        Abrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCampaign.mutate(campaign.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {campaign.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      campaign.status === 'active' 
                        ? 'bg-forest/20 text-forest' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {campaign.status === 'active' ? 'Ativa' : 'Pausada'}
                    </span>
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
