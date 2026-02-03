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
import { Plus, MapPin, Search, AlertCircle, MoreVertical, Trash2, Edit } from 'lucide-react';
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

interface Location {
  id: string;
  name: string;
  description: string | null;
  type: string;
  population: string | null;
  government: string | null;
  notable_features: string | null;
  secrets: string | null;
  image_url: string | null;
}

const locationTypes = [
  'Cidade', 'Vila', 'Aldeia', 'Castelo', 'Fortaleza', 'Ruínas', 'Floresta',
  'Montanha', 'Caverna', 'Templo', 'Masmorra', 'Taverna', 'Porto', 'Ilha', 'Outro'
];

export default function Locations() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'Cidade',
    population: '',
    government: '',
    notable_features: '',
    secrets: '',
  });

  useEffect(() => {
    if (!activeCampaign) {
      setIsLoading(false);
      return;
    }
    loadLocations();
  }, [activeCampaign]);

  const loadLocations = async () => {
    if (!activeCampaign) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('campaign_id', activeCampaign.id)
      .order('name');

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setLocations(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !activeCampaign || !user) return;

    const { error } = await supabase.from('locations').insert({
      ...formData,
      campaign_id: activeCampaign.id,
      user_id: user.id,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Local criado!', description: `${formData.name} foi adicionado.` });
      setFormData({
        name: '', description: '', type: 'Cidade', population: '',
        government: '', notable_features: '', secrets: '',
      });
      setIsDialogOpen(false);
      loadLocations();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Local removido' });
      loadLocations();
    }
  };

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!activeCampaign) {
    return (
      <AppLayout title="Locais">
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
      title="Locais"
      actions={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar locais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Local
            </Button>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Criar Local</DialogTitle>
                <DialogDescription>
                  Adicione um novo local ao seu mundo
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome do local"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {locationTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva o local..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>População</Label>
                  <Input
                    placeholder="~5.000 habitantes"
                    value={formData.population}
                    onChange={(e) => setFormData({ ...formData, population: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Governo</Label>
                  <Input
                    placeholder="Monarquia, Conselho..."
                    value={formData.government}
                    onChange={(e) => setFormData({ ...formData, government: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Características Notáveis</Label>
                  <Textarea
                    placeholder="O que torna este local único?"
                    value={formData.notable_features}
                    onChange={(e) => setFormData({ ...formData, notable_features: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Segredos</Label>
                  <Textarea
                    placeholder="Segredos ocultos..."
                    value={formData.secrets}
                    onChange={(e) => setFormData({ ...formData, secrets: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Criar Local</Button>
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
      ) : filteredLocations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            {searchTerm ? 'Nenhum local encontrado' : 'Nenhum local ainda'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente outra busca' : 'Comece criando locais para seu mundo'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Local
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location, index) => (
            <motion.div
              key={location.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full hover:border-primary/50 transition-all">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="font-display text-lg">{location.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline">{location.type}</Badge>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(location.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-2">
                  {location.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{location.description}</p>
                  )}
                  {location.population && (
                    <p className="text-xs text-muted-foreground">👥 {location.population}</p>
                  )}
                  {location.government && (
                    <p className="text-xs text-muted-foreground">🏛️ {location.government}</p>
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
