import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  MousePointer2,
  Paintbrush,
  Eraser,
  Minus,
  Square,
  Circle,
  PaintBucket,
  Palette,
  Undo2,
  Redo2,
  Trash2,
} from 'lucide-react';
import { DrawingTool, DrawingState, DRAWING_COLORS, BRUSH_SIZES } from './drawingTypes';
import { cn } from '@/lib/utils';

interface DrawingToolbarProps {
  drawingState: DrawingState;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onOpacityChange: (opacity: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearLayer: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { tool: DrawingTool; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Selecionar' },
  { tool: 'brush', icon: <Paintbrush className="w-4 h-4" />, label: 'Pincel' },
  { tool: 'eraser', icon: <Eraser className="w-4 h-4" />, label: 'Borracha' },
  { tool: 'line', icon: <Minus className="w-4 h-4" />, label: 'Linha' },
  { tool: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Retângulo' },
  { tool: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Círculo' },
  { tool: 'fill', icon: <PaintBucket className="w-4 h-4" />, label: 'Preencher' },
];

export function DrawingToolbar({
  drawingState,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onOpacityChange,
  onUndo,
  onRedo,
  onClearLayer,
  canUndo,
  canRedo,
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg shadow-sm">
      <TooltipProvider>
        {/* Tool buttons */}
        <div className="flex gap-1 border-r border-border pr-2">
          {tools.map(({ tool, icon, label }) => (
            <Tooltip key={tool}>
              <TooltipTrigger asChild>
                <Button
                  variant={drawingState.currentTool === tool ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToolChange(tool)}
                >
                  {icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 relative"
            >
              <Palette className="w-4 h-4" />
              <div
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                style={{ backgroundColor: drawingState.brushColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="grid grid-cols-6 gap-1.5">
              {DRAWING_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    'w-6 h-6 rounded-md border-2 transition-transform hover:scale-110',
                    drawingState.brushColor === color
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => onColorChange(color)}
                />
              ))}
            </div>
            <div className="mt-3">
              <Label className="text-xs">Cor personalizada</Label>
              <input
                type="color"
                value={drawingState.brushColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-8 mt-1 cursor-pointer rounded border-0"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Brush size */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <div
                className="rounded-full bg-foreground"
                style={{
                  width: Math.min(16, drawingState.brushSize / 2),
                  height: Math.min(16, drawingState.brushSize / 2),
                }}
              />
              <span className="text-xs">{drawingState.brushSize}px</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="start">
            <Label className="text-xs">Tamanho do Pincel</Label>
            <div className="flex items-center gap-2 mt-2">
              <Slider
                value={[drawingState.brushSize]}
                onValueChange={(v) => onBrushSizeChange(v[0])}
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">{drawingState.brushSize}</span>
            </div>
            <div className="flex gap-1 mt-2">
              {BRUSH_SIZES.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={drawingState.brushSize === value ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs px-1"
                  onClick={() => onBrushSizeChange(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Opacity */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              {Math.round(drawingState.brushOpacity * 100)}%
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="start">
            <Label className="text-xs">Opacidade</Label>
            <div className="flex items-center gap-2 mt-2">
              <Slider
                value={[drawingState.brushOpacity * 100]}
                onValueChange={(v) => onOpacityChange(v[0] / 100)}
                min={10}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-xs w-8 text-right">
                {Math.round(drawingState.brushOpacity * 100)}%
              </span>
            </div>
          </PopoverContent>
        </Popover>

        {/* Undo/Redo */}
        <div className="flex gap-1 border-l border-border pl-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Desfazer (Ctrl+Z)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refazer (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* Clear layer */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onClearLayer}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Limpar Camada</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
