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
import { Plus, FolderOpen, Search, Image, FileText, Music, Video, Upload, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Resource {
  id: string;
  name: string;
  description: string | null;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  is_global: boolean;
}

const resourceTypes = [
  { value: 'image', label: 'Imagem', icon: Image },
  { value: 'document', label: 'Documento', icon: FileText },
  { value: 'audio', label: 'Áudio', icon: Music },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'token', label: 'Token', icon: Image },
  { value: 'map', label: 'Mapa', icon: Image },
  { value: 'other', label: 'Outro', icon: FileText },
];

export default function Resources() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'image',
    file_url: '',
    tags: '',
  });

  useEffect(() => {
    loadResources();
  }, [activeCampaign, user]);

  const loadResources = async () => {
    if (!user) return;
    setIsLoading(true);
    
    let query = supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (activeCampaign) {
      query = query.or(`campaign_id.eq.${activeCampaign.id},is_global.eq.true`);
    } else {
      query = query.eq('is_global', true);
    }

    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setResources(data || []);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !user) return;

    const { error } = await supabase.from('resources').insert({
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      file_url: formData.file_url || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
      user_id: user.id,
      campaign_id: activeCampaign?.id || null,
      is_global: !activeCampaign,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Recurso adicionado!', description: `${formData.name} foi salvo na biblioteca.` });
      setFormData({ name: '', description: '', type: 'image', file_url: '', tags: '' });
      setIsDialogOpen(false);
      loadResources();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Recurso removido' });
      loadResources();
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === 'all' || r.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    const found = resourceTypes.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  return (
    <AppLayout
      title="Biblioteca de Recursos"
      actions={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="glow-gold">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Recurso
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Adicionar Recurso</DialogTitle>
                <DialogDescription>
                  Salve imagens, documentos e outros recursos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome do recurso"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <t.icon className="w-4 h-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL do Arquivo</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição do recurso..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    placeholder="mapa, cidade, fantasia..."
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="image">Imagens</TabsTrigger>
          <TabsTrigger value="map">Mapas</TabsTrigger>
          <TabsTrigger value="token">Tokens</TabsTrigger>
          <TabsTrigger value="document">Documentos</TabsTrigger>
          <TabsTrigger value="audio">Áudio</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-t-lg" />
                  <CardContent className="p-4"><div className="h-4 bg-muted rounded w-3/4" /></CardContent>
                </Card>
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">
                {searchTerm ? 'Nenhum recurso encontrado' : 'Biblioteca Vazia'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente outra busca' : 'Comece adicionando imagens, mapas e outros recursos'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Recurso
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredResources.map((resource, index) => {
                const TypeIcon = getTypeIcon(resource.type);
                return (
                  <motion.div
                    key={resource.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="overflow-hidden hover:border-primary/50 transition-all group">
                      <div className="aspect-square bg-muted relative flex items-center justify-center">
                        {resource.file_url && (resource.type === 'image' || resource.type === 'token' || resource.type === 'map') ? (
                          <img
                            src={resource.file_url}
                            alt={resource.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <TypeIcon className="w-16 h-16 text-muted-foreground" />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {resource.file_url && (
                              <DropdownMenuItem asChild>
                                <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />Abrir
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(resource.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium truncate">{resource.name}</h4>
                        {resource.tags && resource.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {resource.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
