import { MapData } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Save, Settings, Grid3X3, ZoomIn, ZoomOut } from 'lucide-react';

interface MapToolbarProps {
  map: MapData;
  isSaving: boolean;
  onSave: () => void;
  onMapUpdate: (updates: Partial<MapData>) => void;
}

const GRID_PRESETS = [
  { label: 'Pequeno (15x10)', width: 15, height: 10 },
  { label: 'Médio (20x15)', width: 20, height: 15 },
  { label: 'Grande (30x20)', width: 30, height: 20 },
  { label: 'Enorme (40x30)', width: 40, height: 30 },
];

const CELL_SIZES = [
  { label: 'Pequeno', size: 30 },
  { label: 'Normal', size: 40 },
  { label: 'Grande', size: 50 },
  { label: 'Muito Grande', size: 60 },
];

export function MapToolbar({ map, isSaving, onSave, onMapUpdate }: MapToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
      <Input
        value={map.name}
        onChange={(e) => onMapUpdate({ name: e.target.value })}
        className="w-48 h-8 text-sm font-medium"
        placeholder="Nome do mapa..."
      />

      <div className="h-6 w-px bg-border" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Presets</Label>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {GRID_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      onMapUpdate({
                        grid_width: preset.width,
                        grid_height: preset.height,
                      })
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Largura</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={map.grid_width}
                  onChange={(e) =>
                    onMapUpdate({ grid_width: parseInt(e.target.value) || 20 })
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Altura</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={map.grid_height}
                  onChange={(e) =>
                    onMapUpdate({ grid_height: parseInt(e.target.value) || 15 })
                  }
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4 mr-2" />
            Zoom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48" align="start">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tamanho das células</Label>
            {CELL_SIZES.map((option) => (
              <Button
                key={option.size}
                variant={map.cell_size === option.size ? 'default' : 'outline'}
                size="sm"
                className="w-full justify-start"
                onClick={() => onMapUpdate({ cell_size: option.size })}
              >
                {option.label} ({option.size}px)
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Config
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={map.background_color || '#1a1a2e'}
                  onChange={(e) => onMapUpdate({ background_color: e.target.value })}
                  className="w-12 h-8 p-1 cursor-pointer"
                />
                <Input
                  value={map.background_color || '#1a1a2e'}
                  onChange={(e) => onMapUpdate({ background_color: e.target.value })}
                  className="flex-1 h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">URL da Imagem de Fundo</Label>
              <Input
                value={map.background_image_url || ''}
                onChange={(e) => onMapUpdate({ background_image_url: e.target.value })}
                placeholder="https://..."
                className="h-8 text-xs"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="flex-1" />

      <Button onClick={onSave} disabled={isSaving}>
        <Save className="w-4 h-4 mr-2" />
        {isSaving ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
}
