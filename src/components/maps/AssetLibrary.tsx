import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ASSET_CATEGORIES, 
  PREDEFINED_ASSETS, 
  AssetDefinition,
  MapAsset,
  getAssetByKey
} from './assetTypes';
import { Trash2, RotateCw, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';

interface AssetLibraryProps {
  assets: MapAsset[];
  selectedAssetId: string | null;
  onAssetSelect: (id: string | null) => void;
  onAssetPlace: (assetKey: string, category: string) => void;
  onAssetUpdate: (id: string, updates: Partial<MapAsset>) => void;
  onAssetDelete: (id: string) => void;
}

export function AssetLibrary({
  assets,
  selectedAssetId,
  onAssetSelect,
  onAssetPlace,
  onAssetUpdate,
  onAssetDelete,
}: AssetLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ASSET_CATEGORIES[0].id);
  
  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const selectedAssetDef = selectedAsset ? getAssetByKey(selectedAsset.asset_key) : null;

  const filteredAssets = PREDEFINED_ASSETS.filter(a => a.category === activeCategory);

  const handleDragStart = (e: React.DragEvent, asset: AssetDefinition) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      assetKey: asset.key,
      category: asset.category,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h3 className="font-display text-sm font-bold">Biblioteca de Assets</h3>
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-2 mt-2">
          {ASSET_CATEGORIES.slice(0, 3).map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs px-2">
              {cat.icon}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsList className="grid grid-cols-3 mx-2 mt-1">
          {ASSET_CATEGORIES.slice(3).map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs px-2">
              {cat.icon}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="px-2 py-1">
          <Label className="text-xs text-muted-foreground">
            {ASSET_CATEGORIES.find(c => c.id === activeCategory)?.name}
          </Label>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="grid grid-cols-4 gap-1 pb-2">
            {filteredAssets.map((asset) => (
              <button
                key={asset.key}
                draggable
                onDragStart={(e) => handleDragStart(e, asset)}
                onClick={() => onAssetPlace(asset.key, asset.category)}
                className="aspect-square flex items-center justify-center text-2xl bg-muted hover:bg-muted/80 rounded cursor-grab active:cursor-grabbing transition-colors border border-transparent hover:border-primary/50"
                title={asset.name}
              >
                {asset.icon}
              </button>
            ))}
          </div>
        </ScrollArea>
      </Tabs>

      {/* Selected asset editor */}
      {selectedAsset && selectedAssetDef && (
        <div className="p-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedAssetDef.icon}</span>
              <span className="text-sm font-medium">{selectedAssetDef.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                onAssetDelete(selectedAsset.id);
                onAssetSelect(null);
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAssetUpdate(selectedAsset.id, { 
                rotation: ((selectedAsset.rotation || 0) + 45) % 360 
              })}
            >
              <RotateCw className="w-4 h-4 mr-1" />
              {selectedAsset.rotation || 0}°
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAssetUpdate(selectedAsset.id, { 
                scale: Math.max(0.5, (selectedAsset.scale || 1) - 0.25) 
              })}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAssetUpdate(selectedAsset.id, { 
                scale: Math.min(3, (selectedAsset.scale || 1) + 0.25) 
              })}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onAssetUpdate(selectedAsset.id, { 
                is_visible: !selectedAsset.is_visible 
              })}
            >
              {selectedAsset.is_visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Placed assets list */}
      <div className="border-t border-border p-2">
        <Label className="text-xs text-muted-foreground mb-2 block">
          No mapa ({assets.length})
        </Label>
        <ScrollArea className="h-24">
          <div className="space-y-1">
            {assets.map((asset) => {
              const def = getAssetByKey(asset.asset_key);
              return (
                <button
                  key={asset.id}
                  onClick={() => onAssetSelect(asset.id)}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1 rounded text-left text-sm
                    ${selectedAssetId === asset.id ? 'bg-primary/20' : 'hover:bg-muted'}
                  `}
                >
                  <span>{def?.icon || '📦'}</span>
                  <span className="truncate">{def?.name || asset.asset_key}</span>
                  {!asset.is_visible && <EyeOff className="w-3 h-3 ml-auto opacity-50" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
