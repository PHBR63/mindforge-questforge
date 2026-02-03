import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  GripVertical,
  Layers,
} from 'lucide-react';
import { MapLayer } from './drawingTypes';
import { cn } from '@/lib/utils';

interface LayerPanelProps {
  layers: MapLayer[];
  activeLayerId: string | null;
  onLayerSelect: (layerId: string) => void;
  onLayerCreate: (name: string, layerType: string) => void;
  onLayerUpdate: (layerId: string, updates: Partial<MapLayer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerReorder: (layerId: string, newOrder: number) => void;
}

export function LayerPanel({
  layers,
  activeLayerId,
  onLayerSelect,
  onLayerCreate,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder,
}: LayerPanelProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');

  const sortedLayers = [...layers].sort(
    (a, b) => (b.layer_order || 0) - (a.layer_order || 0)
  );

  const handleCreateLayer = () => {
    if (!newLayerName.trim()) return;
    onLayerCreate(newLayerName.trim(), 'custom');
    setNewLayerName('');
    setIsCreateDialogOpen(false);
  };

  const getLayerIcon = (layerType: string) => {
    switch (layerType) {
      case 'background':
        return '🖼️';
      case 'terrain':
        return '🗺️';
      case 'objects':
        return '📦';
      case 'tokens':
        return '👤';
      case 'effects':
        return '✨';
      default:
        return '📄';
    }
  };

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Camadas</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedLayers.map((layer) => (
            <div
              key={layer.id}
              className={cn(
                'group p-2 rounded-md cursor-pointer transition-colors',
                activeLayerId === layer.id
                  ? 'bg-primary/20 border border-primary/30'
                  : 'hover:bg-accent/50'
              )}
              onClick={() => onLayerSelect(layer.id)}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                <span className="text-sm">{getLayerIcon(layer.layer_type)}</span>
                <span className="flex-1 text-sm truncate">{layer.name}</span>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerUpdate(layer.id, { is_locked: !layer.is_locked });
                  }}
                >
                  {layer.is_locked ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <Unlock className="w-3 h-3" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayerUpdate(layer.id, { is_visible: !layer.is_visible });
                  }}
                >
                  {layer.is_visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  )}
                </Button>
              </div>

              {activeLayerId === layer.id && (
                <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground w-16">
                      Opacidade
                    </Label>
                    <Slider
                      value={[(layer.opacity || 1) * 100]}
                      onValueChange={(v) =>
                        onLayerUpdate(layer.id, { opacity: v[0] / 100 })
                      }
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-right">
                      {Math.round((layer.opacity || 1) * 100)}%
                    </span>
                  </div>

                  {layer.layer_type === 'custom' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLayerDelete(layer.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir Camada
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {layers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma camada criada
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Camada</DialogTitle>
            <DialogDescription>
              Crie uma nova camada para organizar seu mapa
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Nome da Camada</Label>
            <Input
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              placeholder="Ex: Decoração"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLayer}>Criar Camada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
