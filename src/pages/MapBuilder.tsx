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
import { MapGrid } from '@/components/maps/MapGrid';
import { TokenPanel } from '@/components/maps/TokenPanel';
import { MapToolbar } from '@/components/maps/MapToolbar';
import { MapData, MapToken } from '@/components/maps/types';
import { Plus, Map, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MapBuilder() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const [maps, setMaps] = useState<MapData[]>([]);
  const [activeMap, setActiveMap] = useState<MapData | null>(null);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMapName, setNewMapName] = useState('');

  // Load maps
  useEffect(() => {
    if (!activeCampaign) return;

    const loadMaps = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .eq('campaign_id', activeCampaign.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar mapas',
          description: error.message,
        });
      } else {
        setMaps(data as MapData[]);
        if (data.length > 0 && !activeMap) {
          setActiveMap(data[0] as MapData);
        }
      }
      setIsLoading(false);
    };

    loadMaps();
  }, [activeCampaign, toast]);

  // Load tokens when map changes
  useEffect(() => {
    if (!activeMap) {
      setTokens([]);
      return;
    }

    const loadTokens = async () => {
      const { data, error } = await supabase
        .from('map_tokens')
        .select('*')
        .eq('map_id', activeMap.id)
        .order('layer', { ascending: true });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar tokens',
          description: error.message,
        });
      } else {
        setTokens(data as MapToken[]);
      }
    };

    loadTokens();
  }, [activeMap, toast]);

  const handleCreateMap = async () => {
    if (!newMapName.trim() || !activeCampaign || !user) return;

    const { data, error } = await supabase
      .from('maps')
      .insert({
        campaign_id: activeCampaign.id,
        user_id: user.id,
        name: newMapName,
        grid_width: 20,
        grid_height: 15,
        cell_size: 40,
        background_color: '#1a1a2e',
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar mapa',
        description: error.message,
      });
      return;
    }

    const newMap = data as MapData;
    setMaps([newMap, ...maps]);
    setActiveMap(newMap);
    setNewMapName('');
    setIsCreateDialogOpen(false);

    toast({
      title: 'Mapa criado!',
      description: `${newMapName} foi criado com sucesso.`,
    });
  };

  const handleDeleteMap = async () => {
    if (!activeMap) return;

    const { error } = await supabase
      .from('maps')
      .delete()
      .eq('id', activeMap.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir mapa',
        description: error.message,
      });
      return;
    }

    const remaining = maps.filter((m) => m.id !== activeMap.id);
    setMaps(remaining);
    setActiveMap(remaining[0] || null);
    setTokens([]);

    toast({
      title: 'Mapa excluído',
      description: 'O mapa foi removido.',
    });
  };

  const handleSaveMap = async () => {
    if (!activeMap) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('maps')
      .update({
        name: activeMap.name,
        grid_width: activeMap.grid_width,
        grid_height: activeMap.grid_height,
        cell_size: activeMap.cell_size,
        background_color: activeMap.background_color,
        background_image_url: activeMap.background_image_url,
      })
      .eq('id', activeMap.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } else {
      toast({
        title: 'Mapa salvo!',
        description: 'As alterações foram salvas.',
      });
    }
    setIsSaving(false);
  };

  const handleMapUpdate = (updates: Partial<MapData>) => {
    if (!activeMap) return;
    setActiveMap({ ...activeMap, ...updates });
  };

  const handleTokenCreate = async (
    tokenData: Omit<MapToken, 'id' | 'map_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!activeMap || !user) return;

    const { data, error } = await supabase
      .from('map_tokens')
      .insert({
        map_id: activeMap.id,
        user_id: user.id,
        ...tokenData,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar token',
        description: error.message,
      });
      return;
    }

    setTokens([...tokens, data as MapToken]);
    toast({
      title: 'Token criado!',
      description: `${tokenData.name} foi adicionado ao mapa.`,
    });
  };

  const handleTokenMove = async (tokenId: string, x: number, y: number) => {
    setTokens(
      tokens.map((t) =>
        t.id === tokenId ? { ...t, position_x: x, position_y: y } : t
      )
    );

    await supabase
      .from('map_tokens')
      .update({ position_x: x, position_y: y })
      .eq('id', tokenId);
  };

  const handleTokenUpdate = async (tokenId: string, updates: Partial<MapToken>) => {
    setTokens(tokens.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)));

    const { error } = await supabase
      .from('map_tokens')
      .update(updates)
      .eq('id', tokenId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar token',
        description: error.message,
      });
    }
  };

  const handleTokenDelete = async (tokenId: string) => {
    const { error } = await supabase
      .from('map_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir token',
        description: error.message,
      });
      return;
    }

    setTokens(tokens.filter((t) => t.id !== tokenId));
  };

  if (!activeCampaign) {
    return (
      <AppLayout title="Construtor de Mapas">
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
            Para usar o construtor de mapas, primeiro selecione ou crie uma campanha.
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
      title={`Construtor de Mapas - ${activeCampaign.name}`}
      actions={
        <div className="flex gap-2">
          <Select
            value={activeMap?.id || ''}
            onValueChange={(id) => {
              const map = maps.find((m) => m.id === id);
              setActiveMap(map || null);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione um mapa" />
            </SelectTrigger>
            <SelectContent>
              {maps.map((map) => (
                <SelectItem key={map.id} value={map.id}>
                  {map.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="glow-gold">
            <Plus className="w-4 h-4 mr-2" />
            Novo Mapa
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
      ) : activeMap ? (
        <div className="space-y-4">
          <MapToolbar
            map={activeMap}
            isSaving={isSaving}
            onSave={handleSaveMap}
            onMapUpdate={handleMapUpdate}
          />

          <div className="flex gap-4">
            <div className="flex-1">
              <MapGrid
                gridWidth={activeMap.grid_width}
                gridHeight={activeMap.grid_height}
                cellSize={activeMap.cell_size}
                backgroundColor={activeMap.background_color || '#1a1a2e'}
                tokens={tokens}
                selectedTokenId={selectedTokenId}
                onTokenMove={handleTokenMove}
                onTokenSelect={setSelectedTokenId}
                onCellClick={(x, y) => console.log('Cell clicked:', x, y)}
              />
            </div>

            <TokenPanel
              tokens={tokens}
              selectedTokenId={selectedTokenId}
              onTokenSelect={setSelectedTokenId}
              onTokenCreate={handleTokenCreate}
              onTokenUpdate={handleTokenUpdate}
              onTokenDelete={handleTokenDelete}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="destructive" size="sm" onClick={handleDeleteMap}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Mapa
            </Button>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <Map className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-display text-xl font-bold mb-2">
            Nenhum Mapa Criado
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Crie seu primeiro mapa para começar a construir encontros e cenários.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Mapa
          </Button>
        </motion.div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Novo Mapa</DialogTitle>
            <DialogDescription>
              Crie um novo mapa para sua campanha
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Nome do Mapa</Label>
              <Input
                placeholder="Ex: Taverna do Dragão Dourado"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMap}>Criar Mapa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
