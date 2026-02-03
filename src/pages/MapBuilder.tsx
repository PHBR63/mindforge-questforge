import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapScene3D } from '@/components/maps/MapScene3D';
import { TokenPanel } from '@/components/maps/TokenPanel';
import { MapToolbar } from '@/components/maps/MapToolbar';
import { AssetLibrary } from '@/components/maps/AssetLibrary';
import { DrawableMapGrid, DrawableMapGridRef } from '@/components/maps/DrawableMapGrid';
import { DrawingToolbar } from '@/components/maps/DrawingToolbar';
import { LayerPanel } from '@/components/maps/LayerPanel';
import { MapExport } from '@/components/maps/MapExport';
import { MapData, MapToken } from '@/components/maps/types';
import { MapAsset } from '@/components/maps/assetTypes';
import { MapDrawing, MapLayer, DrawingState, DrawingTool, DEFAULT_LAYERS } from '@/components/maps/drawingTypes';
import { WallEditor } from '@/components/maps/WallEditor';
import { Model3DLibrary } from '@/components/maps/Model3DLibrary';
import { Models3DRenderer } from '@/components/maps/Models3DRenderer';
import { Map3DModel } from '@/components/maps/model3DTypes';
import { Plus, Map, AlertCircle, Trash2, Grid3X3, Box, Sun, Moon, Flame, Package, Paintbrush, Layers, Columns, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ViewMode = '2d' | '3d' | 'walls';
type Environment3D = 'day' | 'night' | 'dungeon';
type PanelMode = 'tokens' | 'assets' | 'layers' | 'models3d';

export default function MapBuilder() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const mapGridRef = useRef<DrawableMapGridRef>(null);

  const [maps, setMaps] = useState<MapData[]>([]);
  const [activeMap, setActiveMap] = useState<MapData | null>(null);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [assets, setAssets] = useState<MapAsset[]>([]);
  const [drawings, setDrawings] = useState<MapDrawing[]>([]);
  const [layers, setLayers] = useState<MapLayer[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [models3D, setModels3D] = useState<Map3DModel[]>([]);
  const [selectedModel3DId, setSelectedModel3DId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [environment3D, setEnvironment3D] = useState<Environment3D>('dungeon');
  const [panelMode, setPanelMode] = useState<PanelMode>('tokens');
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(false);

  // Drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    currentTool: 'select',
    brushColor: '#ffffff',
    brushSize: 10,
    brushOpacity: 1,
    currentPoints: [],
    activeLayerId: null,
  });

  // Undo/Redo history
  const [drawingHistory, setDrawingHistory] = useState<MapDrawing[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  // Load tokens, assets, drawings, and layers when map changes
  useEffect(() => {
    if (!activeMap) {
      setTokens([]);
      setAssets([]);
      setDrawings([]);
      setLayers([]);
      setModels3D([]);
      return;
    }

    const loadMapData = async () => {
      const [tokensResult, assetsResult, drawingsResult, layersResult, models3DResult] = await Promise.all([
        supabase
          .from('map_tokens')
          .select('*')
          .eq('map_id', activeMap.id)
          .order('layer', { ascending: true }),
        supabase
          .from('map_assets')
          .select('*')
          .eq('map_id', activeMap.id)
          .order('layer', { ascending: true }),
        supabase
          .from('map_drawings')
          .select('*')
          .eq('map_id', activeMap.id)
          .order('layer', { ascending: true }),
        supabase
          .from('map_layers')
          .select('*')
          .eq('map_id', activeMap.id)
          .order('layer_order', { ascending: true }),
        supabase
          .from('map_3d_models')
          .select('*')
          .eq('map_id', activeMap.id)
          .order('layer', { ascending: true }),
      ]);

      if (tokensResult.error) {
        console.error('Error loading tokens:', tokensResult.error);
      } else {
        setTokens(tokensResult.data as MapToken[]);
      }

      if (assetsResult.error) {
        console.error('Error loading assets:', assetsResult.error);
      } else {
        setAssets(assetsResult.data as MapAsset[]);
      }

      if (drawingsResult.error) {
        console.error('Error loading drawings:', drawingsResult.error);
      } else {
        const loadedDrawings = (drawingsResult.data || []).map((d: any) => ({
          ...d,
          points: Array.isArray(d.points) ? d.points : JSON.parse(d.points || '[]'),
        }));
        setDrawings(loadedDrawings);
        setDrawingHistory([loadedDrawings]);
        setHistoryIndex(0);
      }

      if (layersResult.error) {
        console.error('Error loading layers:', layersResult.error);
      } else {
        setLayers(layersResult.data as MapLayer[]);
      }

      if (models3DResult.error) {
        console.error('Error loading 3D models:', models3DResult.error);
      } else {
        const typedModels = (models3DResult.data || []).map((m: any) => ({
          ...m,
          position_x: Number(m.position_x),
          position_y: Number(m.position_y),
          position_z: Number(m.position_z),
          rotation_x: Number(m.rotation_x),
          rotation_y: Number(m.rotation_y),
          rotation_z: Number(m.rotation_z),
          scale: Number(m.scale),
        })) as Map3DModel[];
        setModels3D(typedModels);
      }
    };

    loadMapData();
  }, [activeMap]);

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
    
    // Create default layers for the new map
    const defaultLayers = DEFAULT_LAYERS.map((l) => ({
      map_id: newMap.id,
      user_id: user.id,
      name: l.name,
      layer_type: l.layer_type,
      layer_order: l.layer_order,
    }));

    await supabase.from('map_layers').insert(defaultLayers);

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

  // Asset handlers
  const handleAssetPlace = async (assetKey: string, category: string, x?: number, y?: number) => {
    if (!activeMap || !user) return;

    const { data, error } = await supabase
      .from('map_assets')
      .insert({
        map_id: activeMap.id,
        user_id: user.id,
        asset_type: category,
        asset_key: assetKey,
        position_x: x ?? Math.random() * (activeMap.grid_width - 1),
        position_y: y ?? Math.random() * (activeMap.grid_height - 1),
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar asset',
        description: error.message,
      });
      return;
    }

    setAssets([...assets, data as MapAsset]);
  };

  const handleAssetMove = async (assetId: string, x: number, y: number) => {
    setAssets(assets.map((a) => (a.id === assetId ? { ...a, position_x: x, position_y: y } : a)));

    await supabase
      .from('map_assets')
      .update({ position_x: x, position_y: y })
      .eq('id', assetId);
  };

  const handleAssetUpdate = async (assetId: string, updates: Partial<MapAsset>) => {
    setAssets(assets.map((a) => (a.id === assetId ? { ...a, ...updates } : a)));

    const { error } = await supabase
      .from('map_assets')
      .update(updates)
      .eq('id', assetId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar asset',
        description: error.message,
      });
    }
  };

  const handleAssetDelete = async (assetId: string) => {
    const { error } = await supabase
      .from('map_assets')
      .delete()
      .eq('id', assetId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir asset',
        description: error.message,
      });
      return;
    }

    setAssets(assets.filter((a) => a.id !== assetId));
  };

  // Drawing handlers
  const handleDrawingComplete = async (
    drawingData: Omit<MapDrawing, 'id' | 'map_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!activeMap || !user) return;

    const { data, error } = await supabase
      .from('map_drawings')
      .insert({
        map_id: activeMap.id,
        user_id: user.id,
        ...drawingData,
        points: JSON.stringify(drawingData.points),
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar desenho',
        description: error.message,
      });
      return;
    }

    const newDrawing = {
      ...data,
      points: drawingData.points,
    } as MapDrawing;

    const newDrawings = [...drawings, newDrawing];
    setDrawings(newDrawings);

    // Update history
    const newHistory = drawingHistory.slice(0, historyIndex + 1);
    newHistory.push(newDrawings);
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDrawings(drawingHistory[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < drawingHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDrawings(drawingHistory[historyIndex + 1]);
    }
  };

  const handleClearLayer = async () => {
    if (!activeMap) return;

    const { error } = await supabase
      .from('map_drawings')
      .delete()
      .eq('map_id', activeMap.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao limpar desenhos',
        description: error.message,
      });
      return;
    }

    setDrawings([]);
    const newHistory = [...drawingHistory, []];
    setDrawingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    toast({
      title: 'Desenhos limpos',
      description: 'Todos os desenhos foram removidos.',
    });
  };

  // Layer handlers
  const handleLayerCreate = async (name: string, layerType: string) => {
    if (!activeMap || !user) return;

    const maxOrder = Math.max(...layers.map((l) => l.layer_order || 0), -1);

    const { data, error } = await supabase
      .from('map_layers')
      .insert({
        map_id: activeMap.id,
        user_id: user.id,
        name,
        layer_type: layerType,
        layer_order: maxOrder + 1,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar camada',
        description: error.message,
      });
      return;
    }

    setLayers([...layers, data as MapLayer]);
  };

  const handleLayerUpdate = async (layerId: string, updates: Partial<MapLayer>) => {
    setLayers(layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)));

    const { error } = await supabase
      .from('map_layers')
      .update(updates)
      .eq('id', layerId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar camada',
        description: error.message,
      });
    }
  };

  const handleLayerDelete = async (layerId: string) => {
    const { error } = await supabase
      .from('map_layers')
      .delete()
      .eq('id', layerId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir camada',
        description: error.message,
      });
      return;
    }

    setLayers(layers.filter((l) => l.id !== layerId));
  };

  const handleLayerReorder = async (layerId: string, newOrder: number) => {
    // TODO: Implement layer reordering with drag and drop
  };

  // 3D Model handlers
  const handleModel3DCreate = async (
    modelData: Omit<Map3DModel, 'id' | 'map_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!activeMap || !user) return;

    const { data, error } = await supabase
      .from('map_3d_models')
      .insert({
        map_id: activeMap.id,
        user_id: user.id,
        name: modelData.name,
        file_url: modelData.file_url,
        thumbnail_url: modelData.thumbnail_url,
        position_x: modelData.position_x,
        position_y: modelData.position_y,
        position_z: modelData.position_z,
        rotation_x: modelData.rotation_x,
        rotation_y: modelData.rotation_y,
        rotation_z: modelData.rotation_z,
        scale: modelData.scale,
        layer: modelData.layer,
        is_visible: modelData.is_visible,
        animation_name: modelData.animation_name,
        animation_playing: modelData.animation_playing,
        metadata: modelData.metadata,
      })
      .select()
      .single();

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar modelo 3D',
        description: error.message,
      });
      return;
    }

    const newModel = {
      ...data,
      position_x: Number(data.position_x),
      position_y: Number(data.position_y),
      position_z: Number(data.position_z),
      rotation_x: Number(data.rotation_x),
      rotation_y: Number(data.rotation_y),
      rotation_z: Number(data.rotation_z),
      scale: Number(data.scale),
    } as Map3DModel;

    setModels3D([...models3D, newModel]);
    toast({
      title: 'Modelo adicionado!',
      description: `${modelData.name} foi adicionado ao mapa.`,
    });
  };

  const handleModel3DUpdate = async (modelId: string, updates: Partial<Map3DModel>) => {
    setModels3D(models3D.map((m) => (m.id === modelId ? { ...m, ...updates } : m)));

    // Filter out fields that shouldn't be sent to DB
    const { id, map_id, user_id, created_at, updated_at, ...dbUpdates } = updates as any;

    const { error } = await supabase
      .from('map_3d_models')
      .update(dbUpdates)
      .eq('id', modelId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar modelo 3D',
        description: error.message,
      });
    }
  };

  const handleModel3DDelete = async (modelId: string) => {
    const { error } = await supabase
      .from('map_3d_models')
      .delete()
      .eq('id', modelId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir modelo 3D',
        description: error.message,
      });
      return;
    }

    setModels3D(models3D.filter((m) => m.id !== modelId));
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MapToolbar
                map={activeMap}
                isSaving={isSaving}
                onSave={handleSaveMap}
                onMapUpdate={handleMapUpdate}
              />
              {activeMap && (
                <MapExport
                  map={activeMap}
                  tokens={tokens}
                  assets={assets}
                  drawings={drawings}
                  layers={layers}
                  canvasRef={{ current: mapGridRef.current?.getCanvas() || null }}
                />
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Drawing toggle */}
              {viewMode === '2d' && (
                <Button
                  variant={showDrawingToolbar ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowDrawingToolbar(!showDrawingToolbar)}
                  className="gap-2"
                >
                  <Paintbrush className="w-4 h-4" />
                  Desenhar
                </Button>
              )}

              {/* Environment selector for 3D */}
              {viewMode === '3d' && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Ambiente:</Label>
                  <div className="flex gap-1">
                    <Button
                      variant={environment3D === 'day' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEnvironment3D('day')}
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={environment3D === 'night' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEnvironment3D('night')}
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={environment3D === 'dungeon' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEnvironment3D('dungeon')}
                    >
                      <Flame className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Panel mode toggle */}
              <Tabs value={panelMode} onValueChange={(v) => setPanelMode(v as PanelMode)}>
                <TabsList>
                  <TabsTrigger value="tokens" className="gap-2 text-xs">
                    Tokens
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="gap-2 text-xs">
                    <Package className="w-3 h-3" />
                    Assets
                  </TabsTrigger>
                  <TabsTrigger value="models3d" className="gap-2 text-xs">
                    <Boxes className="w-3 h-3" />
                    3D
                  </TabsTrigger>
                  <TabsTrigger value="layers" className="gap-2 text-xs">
                    <Layers className="w-3 h-3" />
                    Camadas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* 2D/3D/Walls Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="2d" className="gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    2D
                  </TabsTrigger>
                  <TabsTrigger value="3d" className="gap-2">
                    <Box className="w-4 h-4" />
                    3D
                  </TabsTrigger>
                  <TabsTrigger value="walls" className="gap-2">
                    <Columns className="w-4 h-4" />
                    Paredes
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Drawing toolbar */}
          {showDrawingToolbar && viewMode === '2d' && (
            <DrawingToolbar
              drawingState={drawingState}
              onToolChange={(tool) => setDrawingState({ ...drawingState, currentTool: tool })}
              onColorChange={(color) => setDrawingState({ ...drawingState, brushColor: color })}
              onBrushSizeChange={(size) => setDrawingState({ ...drawingState, brushSize: size })}
              onOpacityChange={(opacity) => setDrawingState({ ...drawingState, brushOpacity: opacity })}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClearLayer={handleClearLayer}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < drawingHistory.length - 1}
            />
          )}

          {viewMode === 'walls' ? (
            <div style={{ height: 'calc(100vh - 18rem)' }}>
              <WallEditor
                mapId={activeMap.id}
                gridWidth={activeMap.grid_width}
                gridHeight={activeMap.grid_height}
                cellSize={activeMap.cell_size}
              />
            </div>
          ) : (
            <div className="flex gap-0">
              <div className="flex-1" style={{ height: 'calc(100vh - 22rem)' }}>
                {viewMode === '2d' ? (
                  <DrawableMapGrid
                    ref={mapGridRef}
                    gridWidth={activeMap.grid_width}
                    gridHeight={activeMap.grid_height}
                    cellSize={activeMap.cell_size}
                    backgroundColor={activeMap.background_color || '#1a1a2e'}
                    tokens={tokens}
                    assets={assets}
                    drawings={drawings}
                    selectedTokenId={selectedTokenId}
                    selectedAssetId={selectedAssetId}
                    drawingState={drawingState}
                    onTokenMove={handleTokenMove}
                    onTokenSelect={(id) => {
                      setSelectedTokenId(id);
                      if (id) setSelectedAssetId(null);
                    }}
                    onAssetSelect={(id) => {
                      setSelectedAssetId(id);
                      if (id) setSelectedTokenId(null);
                    }}
                    onAssetMove={handleAssetMove}
                    onCellClick={(x, y) => console.log('Cell clicked:', x, y)}
                    onAssetDrop={handleAssetPlace}
                    onDrawingComplete={handleDrawingComplete}
                  />
                ) : (
                  <MapScene3D
                    gridWidth={activeMap.grid_width}
                    gridHeight={activeMap.grid_height}
                    cellSize={activeMap.cell_size / 10}
                    backgroundColor={activeMap.background_color || '#1a1a2e'}
                    tokens={tokens}
                    models3D={models3D}
                    selectedTokenId={selectedTokenId}
                    selectedModel3DId={selectedModel3DId}
                    onTokenSelect={setSelectedTokenId}
                    onModel3DSelect={setSelectedModel3DId}
                    environment={environment3D}
                  />
                )}
              </div>

              {panelMode === 'tokens' && (
                <TokenPanel
                  tokens={tokens}
                  selectedTokenId={selectedTokenId}
                  onTokenSelect={setSelectedTokenId}
                  onTokenCreate={handleTokenCreate}
                  onTokenUpdate={handleTokenUpdate}
                  onTokenDelete={handleTokenDelete}
                />
              )}

              {panelMode === 'assets' && (
                <AssetLibrary
                  assets={assets}
                  selectedAssetId={selectedAssetId}
                  onAssetSelect={setSelectedAssetId}
                  onAssetPlace={(key, cat) => handleAssetPlace(key, cat)}
                  onAssetUpdate={handleAssetUpdate}
                  onAssetDelete={handleAssetDelete}
                />
              )}

              {panelMode === 'models3d' && activeMap && (
                <Model3DLibrary
                  mapId={activeMap.id}
                  models={models3D}
                  selectedModelId={selectedModel3DId}
                  onModelSelect={setSelectedModel3DId}
                  onModelCreate={handleModel3DCreate}
                  onModelUpdate={handleModel3DUpdate}
                  onModelDelete={handleModel3DDelete}
                />
              )}

              {panelMode === 'layers' && (
                <LayerPanel
                  layers={layers}
                  activeLayerId={drawingState.activeLayerId}
                  onLayerSelect={(id) => setDrawingState({ ...drawingState, activeLayerId: id })}
                  onLayerCreate={handleLayerCreate}
                  onLayerUpdate={handleLayerUpdate}
                  onLayerDelete={handleLayerDelete}
                  onLayerReorder={handleLayerReorder}
                />
              )}
            </div>
          )}

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
