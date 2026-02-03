import { Box } from 'lucide-react';
import { Map3DModel } from './model3DTypes';
import { cn } from '@/lib/utils';

interface Model3DPlaceholderProps {
  model: Map3DModel;
  cellSize: number;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

export function Model3DPlaceholder({
  model,
  cellSize,
  isSelected,
  onClick,
  onDoubleClick,
}: Model3DPlaceholderProps) {
  if (!model.is_visible) return null;

  const size = cellSize * model.scale;
  const x = model.position_x * cellSize;
  const y = model.position_y * cellSize;

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center cursor-pointer transition-all',
        'rounded-md border-2 border-dashed',
        isSelected
          ? 'border-primary bg-primary/20 shadow-lg shadow-primary/30'
          : 'border-blue-400/50 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-500/20'
      )}
      style={{
        left: x,
        top: y,
        width: Math.max(size, cellSize),
        height: Math.max(size, cellSize),
        transform: `rotate(${model.rotation_y}deg)`,
        transformOrigin: 'center center',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      title={`${model.name} (3D Model)`}
    >
      <div className="flex flex-col items-center gap-0.5 pointer-events-none">
        <Box
          className={cn(
            'shrink-0',
            isSelected ? 'text-primary' : 'text-blue-400'
          )}
          style={{
            width: Math.max(size * 0.4, 12),
            height: Math.max(size * 0.4, 12),
          }}
        />
        {size >= 40 && (
          <span
            className={cn(
              'text-[10px] font-medium truncate max-w-full px-1',
              isSelected ? 'text-primary' : 'text-blue-300'
            )}
          >
            {model.name}
          </span>
        )}
      </div>

      {/* Scale indicator */}
      {isSelected && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-primary whitespace-nowrap bg-card/80 px-1 rounded">
          {model.scale.toFixed(1)}x
        </div>
      )}
    </div>
  );
}

interface Model3DOverlayProps {
  models: Map3DModel[];
  cellSize: number;
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
  onModelMove?: (modelId: string, x: number, y: number) => void;
  onSwitchTo3D?: () => void;
}

export function Model3DOverlay({
  models,
  cellSize,
  selectedModelId,
  onModelSelect,
  onModelMove,
  onSwitchTo3D,
}: Model3DOverlayProps) {
  const visibleModels = models.filter((m) => m.is_visible);

  if (visibleModels.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {visibleModels.map((model) => (
        <div key={model.id} className="pointer-events-auto">
          <Model3DPlaceholder
            model={model}
            cellSize={cellSize}
            isSelected={selectedModelId === model.id}
            onClick={() => onModelSelect(model.id)}
            onDoubleClick={onSwitchTo3D}
          />
        </div>
      ))}
    </div>
  );
}
