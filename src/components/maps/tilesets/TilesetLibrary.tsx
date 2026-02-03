import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { RotateCw, Trash2, ZoomIn, ZoomOut, Eye, EyeOff, Grid3X3, Paintbrush } from 'lucide-react';
import { 
  TILESET_CATEGORIES, 
  EMBEDDED_TILES, 
  getTileById,
  getTilesByCategory,
  TileDefinition 
} from './tilesetData';

export interface PlacedTile {
  id: string;
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  isVisible: boolean;
}

interface TilesetLibraryProps {
  placedTiles: PlacedTile[];
  selectedTileInstanceId: string | null;
  onTileSelect: (id: string | null) => void;
  onTilePlaceStart: (tile: TileDefinition) => void;
  onTileUpdate: (id: string, updates: Partial<PlacedTile>) => void;
  onTileDelete: (id: string) => void;
  /** Mode: 'place' for single tile, 'paint' for continuous painting */
  paintMode: 'place' | 'paint';
  onPaintModeChange: (mode: 'place' | 'paint') => void;
  /** Currently selected tile for painting */
  activePaintTile: TileDefinition | null;
  onActivePaintTileChange: (tile: TileDefinition | null) => void;
}

export function TilesetLibrary({
  placedTiles,
  selectedTileInstanceId,
  onTileSelect,
  onTilePlaceStart,
  onTileUpdate,
  onTileDelete,
  paintMode,
  onPaintModeChange,
  activePaintTile,
  onActivePaintTileChange,
}: TilesetLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string>(TILESET_CATEGORIES[0].id);
  
  const selectedInstance = placedTiles.find(t => t.id === selectedTileInstanceId);
  const selectedTileDef = selectedInstance ? getTileById(selectedInstance.tileId) : null;

  const categoryTiles = getTilesByCategory(activeCategory);

  const handleTileClick = (tile: TileDefinition) => {
    if (paintMode === 'paint') {
      // In paint mode, select the tile for painting
      onActivePaintTileChange(activePaintTile?.id === tile.id ? null : tile);
    } else {
      // In place mode, start placing a single tile
      onTilePlaceStart(tile);
    }
  };

  const handleDragStart = (e: React.DragEvent, tile: TileDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'tileset-tile',
      tileId: tile.id,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-sm font-bold">🧱 Tilesets</h3>
          <div className="flex gap-1">
            <Button
              variant={paintMode === 'place' ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7"
              onClick={() => onPaintModeChange('place')}
              title="Modo colocar"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={paintMode === 'paint' ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7"
              onClick={() => onPaintModeChange('paint')}
              title="Modo pintar"
            >
              <Paintbrush className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {paintMode === 'paint' && activePaintTile && (
          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded text-xs">
            <img 
              src={activePaintTile.imageData} 
              alt={activePaintTile.name}
              className="w-6 h-6 rounded"
            />
            <span className="flex-1 truncate">{activePaintTile.name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={() => onActivePaintTileChange(null)}
            >
              ×
            </Button>
          </div>
        )}
      </div>

      {/* Category tabs - 2 rows */}
      <div className="px-2 pt-2 space-y-1">
        <div className="grid grid-cols-4 gap-1">
          {TILESET_CATEGORIES.slice(0, 4).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs transition-colors
                ${activeCategory === cat.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
                }
              `}
              title={cat.name}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {TILESET_CATEGORIES.slice(4).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex flex-col items-center gap-0.5 px-1 py-1.5 rounded text-xs transition-colors
                ${activeCategory === cat.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
                }
              `}
              title={cat.name}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="text-[10px] truncate w-full text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tiles grid */}
      <ScrollArea className="flex-1 px-2 py-2">
        <div className="grid grid-cols-4 gap-1.5">
          {categoryTiles.map((tile) => (
            <button
              key={tile.id}
              draggable
              onDragStart={(e) => handleDragStart(e, tile)}
              onClick={() => handleTileClick(tile)}
              className={`
                aspect-square rounded overflow-hidden border-2 transition-all
                cursor-grab active:cursor-grabbing hover:scale-105
                ${activePaintTile?.id === tile.id && paintMode === 'paint'
                  ? 'border-primary ring-2 ring-primary/50' 
                  : 'border-transparent hover:border-primary/50'
                }
              `}
              title={tile.name}
            >
              <img 
                src={tile.imageData} 
                alt={tile.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
        {categoryTiles.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-4">
            Nenhum tile nesta categoria
          </div>
        )}
      </ScrollArea>

      {/* Selected tile editor */}
      {selectedInstance && selectedTileDef && (
        <div className="p-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src={selectedTileDef.imageData} 
                alt={selectedTileDef.name}
                className="w-8 h-8 rounded"
              />
              <span className="text-sm font-medium truncate">{selectedTileDef.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                onTileDelete(selectedInstance.id);
                onTileSelect(null);
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <div className="flex gap-1">
            {selectedTileDef.rotatable && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onTileUpdate(selectedInstance.id, { 
                  rotation: (selectedInstance.rotation + 90) % 360 
                })}
              >
                <RotateCw className="w-4 h-4 mr-1" />
                {selectedInstance.rotation}°
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onTileUpdate(selectedInstance.id, { 
                scale: Math.max(0.5, selectedInstance.scale - 0.25) 
              })}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onTileUpdate(selectedInstance.id, { 
                scale: Math.min(3, selectedInstance.scale + 0.25) 
              })}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onTileUpdate(selectedInstance.id, { 
                isVisible: !selectedInstance.isVisible 
              })}
            >
              {selectedInstance.isVisible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Placed tiles list */}
      <div className="border-t border-border p-2">
        <Label className="text-xs text-muted-foreground mb-2 block">
          No mapa ({placedTiles.length})
        </Label>
        <ScrollArea className="h-20">
          <div className="space-y-1">
            {placedTiles.slice(-20).reverse().map((instance) => {
              const def = getTileById(instance.tileId);
              return (
                <button
                  key={instance.id}
                  onClick={() => onTileSelect(instance.id)}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm
                    ${selectedTileInstanceId === instance.id ? 'bg-primary/20' : 'hover:bg-muted'}
                  `}
                >
                  {def && (
                    <img 
                      src={def.imageData} 
                      alt={def.name}
                      className="w-5 h-5 rounded"
                    />
                  )}
                  <span className="truncate text-xs">
                    {def?.name || instance.tileId} ({instance.x}, {instance.y})
                  </span>
                  {!instance.isVisible && <EyeOff className="w-3 h-3 ml-auto opacity-50" />}
                </button>
              );
            })}
            {placedTiles.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Arraste tiles para o mapa
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
