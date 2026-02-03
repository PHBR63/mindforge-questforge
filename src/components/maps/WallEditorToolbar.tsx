import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  MousePointer,
  Square,
  DoorOpen,
  Maximize2,
  Lightbulb,
  Eraser,
  Hand,
  Grid,
  Ruler,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  WallEditorState,
  WallEditorTool,
  WALL_COLORS,
  LIGHT_PRESETS,
} from './wallTypes';

interface WallEditorToolbarProps {
  editorState: WallEditorState;
  onToolChange: (tool: WallEditorTool) => void;
  onStateChange: (updates: Partial<WallEditorState>) => void;
}

const TOOLS: { tool: WallEditorTool; icon: React.ElementType; label: string }[] = [
  { tool: 'select', icon: MousePointer, label: 'Selecionar' },
  { tool: 'wall', icon: Square, label: 'Parede' },
  { tool: 'door', icon: DoorOpen, label: 'Porta' },
  { tool: 'window', icon: Maximize2, label: 'Janela' },
  { tool: 'light', icon: Lightbulb, label: 'Luz' },
  { tool: 'erase', icon: Eraser, label: 'Apagar' },
  { tool: 'pan', icon: Hand, label: 'Mover' },
];

export function WallEditorToolbar({
  editorState,
  onToolChange,
  onStateChange,
}: WallEditorToolbarProps) {
  return (
    <TooltipProvider>
      <div className="bg-card rounded-lg border border-border p-3 space-y-4">
        {/* Tool buttons */}
        <div className="flex flex-wrap gap-1">
          {TOOLS.map(({ tool, icon: Icon, label }) => (
            <Tooltip key={tool}>
              <TooltipTrigger asChild>
                <Button
                  variant={editorState.currentTool === tool ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onToolChange(tool)}
                  className="p-2"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Wall settings */}
        {editorState.currentTool === 'wall' && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Altura: {editorState.wallHeight.toFixed(1)}m</Label>
              </div>
              <Slider
                value={[editorState.wallHeight]}
                onValueChange={([v]) => onStateChange({ wallHeight: v })}
                min={1}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Espessura: {(editorState.wallThickness * 100).toFixed(0)}cm</Label>
              </div>
              <Slider
                value={[editorState.wallThickness * 100]}
                onValueChange={([v]) => onStateChange({ wallThickness: v / 100 })}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <div
                    className="w-4 h-4 rounded border border-border"
                    style={{ backgroundColor: editorState.wallColor }}
                  />
                  <Palette className="w-3 h-3" />
                  Cor da Parede
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="grid grid-cols-4 gap-1">
                  {WALL_COLORS.map((color) => (
                    <Tooltip key={color.value}>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            'w-8 h-8 rounded border-2 transition-transform hover:scale-110',
                            editorState.wallColor === color.value
                              ? 'border-primary'
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: color.value }}
                          onClick={() => onStateChange({ wallColor: color.value })}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{color.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Door/Window settings */}
        {(editorState.currentTool === 'door' || editorState.currentTool === 'window') && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Largura: {editorState.openingWidth.toFixed(1)}m</Label>
              </div>
              <Slider
                value={[editorState.openingWidth]}
                onValueChange={([v]) => onStateChange({ openingWidth: v })}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Altura: {editorState.openingHeight.toFixed(1)}m</Label>
              </div>
              <Slider
                value={[editorState.openingHeight]}
                onValueChange={([v]) => onStateChange({ openingHeight: v })}
                min={0.5}
                max={4}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Light settings */}
        {editorState.currentTool === 'light' && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <Label className="text-xs">Predefinições</Label>
              <div className="grid grid-cols-2 gap-1">
                {LIGHT_PRESETS.map((preset, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() =>
                      onStateChange({
                        lightType: preset.type as 'point' | 'spot' | 'ambient',
                        lightColor: preset.color,
                        lightIntensity: preset.intensity,
                      })
                    }
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Intensidade: {editorState.lightIntensity.toFixed(1)}</Label>
              </div>
              <Slider
                value={[editorState.lightIntensity]}
                onValueChange={([v]) => onStateChange({ lightIntensity: v })}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-xs">Alcance: {editorState.lightRange.toFixed(0)}m</Label>
              </div>
              <Slider
                value={[editorState.lightRange]}
                onValueChange={([v]) => onStateChange({ lightRange: v })}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* General settings */}
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-3 h-3" />
              <Label className="text-xs">Snap to Grid</Label>
            </div>
            <Switch
              checked={editorState.snapToGrid}
              onCheckedChange={(v) => onStateChange({ snapToGrid: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler className="w-3 h-3" />
              <Label className="text-xs">Mostrar Medidas</Label>
            </div>
            <Switch
              checked={editorState.showMeasurements}
              onCheckedChange={(v) => onStateChange({ showMeasurements: v })}
            />
          </div>

          <Select
            value={editorState.measurementUnit}
            onValueChange={(v) => onStateChange({ measurementUnit: v as 'meters' | 'feet' })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meters">Metros</SelectItem>
              <SelectItem value="feet">Pés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </TooltipProvider>
  );
}
