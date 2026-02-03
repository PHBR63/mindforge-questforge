import { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from 'lucide-react';
import { Map3DModel } from './model3DTypes';
import { cn } from '@/lib/utils';

interface Model3DPlaceholderProps {
  model: Map3DModel;
  cellSize: number;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (modelId: string, startX: number, startY: number) => void;
  onDrag?: (modelId: string, x: number, y: number) => void;
  onDragEnd?: (modelId: string, x: number, y: number) => void;
  isDragging?: boolean;
}

export function Model3DPlaceholder({
  model,
  cellSize,
  isSelected,
  onClick,
  onDoubleClick,
  onDragStart,
  onDrag,
  onDragEnd,
  isDragging = false,
}: Model3DPlaceholderProps) {
  if (!model.is_visible) return null;

  const size = cellSize * model.scale;
  const x = model.position_x * cellSize;
  const y = model.position_y * cellSize;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    
    onClick();
    onDragStart?.(model.id, e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    onClick();
    const touch = e.touches[0];
    onDragStart?.(model.id, touch.clientX, touch.clientY);
  };

  return (
    <div
      className={cn(
        'absolute flex items-center justify-center transition-all select-none',
        'rounded-md border-2 border-dashed',
        isDragging
          ? 'border-primary bg-primary/30 shadow-xl shadow-primary/40 cursor-grabbing z-50 scale-105'
          : isSelected
            ? 'border-primary bg-primary/20 shadow-lg shadow-primary/30 cursor-grab'
            : 'border-blue-400/50 bg-blue-500/10 hover:border-blue-400 hover:bg-blue-500/20 cursor-grab'
      )}
      style={{
        left: x,
        top: y,
        width: Math.max(size, cellSize),
        height: Math.max(size, cellSize),
        transform: `rotate(${model.rotation_y}deg)`,
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.();
      }}
      title={`${model.name} (3D Model) - Arraste para mover`}
    >
      <div className="flex flex-col items-center gap-0.5 pointer-events-none">
        <Box
          className={cn(
            'shrink-0',
            isDragging ? 'text-primary animate-pulse' : isSelected ? 'text-primary' : 'text-blue-400'
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
      {isSelected && !isDragging && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-primary whitespace-nowrap bg-card/80 px-1 rounded">
          {model.scale.toFixed(1)}x
        </div>
      )}

      {/* Drag indicator */}
      {isDragging && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-primary whitespace-nowrap bg-primary px-2 py-0.5 rounded text-primary-foreground font-medium">
          Movendo...
        </div>
      )}
    </div>
  );
}

interface DragState {
  isDragging: boolean;
  modelId: string | null;
  startMouseX: number;
  startMouseY: number;
  startModelX: number;
  startModelY: number;
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
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    modelId: null,
    startMouseX: 0,
    startMouseY: 0,
    startModelX: 0,
    startModelY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const visibleModels = models.filter((m) => m.is_visible);

  const handleDragStart = useCallback((modelId: string, mouseX: number, mouseY: number) => {
    const model = models.find((m) => m.id === modelId);
    if (!model) return;

    setDragState({
      isDragging: true,
      modelId,
      startMouseX: mouseX,
      startMouseY: mouseY,
      startModelX: model.position_x,
      startModelY: model.position_y,
    });
  }, [models]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.modelId) return;

    const deltaX = e.clientX - dragState.startMouseX;
    const deltaY = e.clientY - dragState.startMouseY;

    const newX = dragState.startModelX + deltaX / cellSize;
    const newY = dragState.startModelY + deltaY / cellSize;

    // Snap to grid
    const snappedX = Math.round(newX);
    const snappedY = Math.round(newY);

    onModelMove?.(dragState.modelId, snappedX, snappedY);
  }, [dragState, cellSize, onModelMove]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.modelId) {
      // Drag complete - model position already updated via onModelMove
    }
    setDragState({
      isDragging: false,
      modelId: null,
      startMouseX: 0,
      startMouseY: 0,
      startModelX: 0,
      startModelY: 0,
    });
  }, [dragState]);

  // Global mouse event listeners for drag
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove as any);
      window.addEventListener('touchend', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove as any);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragState.isDragging || !dragState.modelId) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startMouseX;
    const deltaY = touch.clientY - dragState.startMouseY;

    const newX = dragState.startModelX + deltaX / cellSize;
    const newY = dragState.startModelY + deltaY / cellSize;

    const snappedX = Math.round(newX);
    const snappedY = Math.round(newY);

    onModelMove?.(dragState.modelId, snappedX, snappedY);
  }, [dragState, cellSize, onModelMove]);

  if (visibleModels.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ cursor: dragState.isDragging ? 'grabbing' : undefined }}
    >
      {visibleModels.map((model) => (
        <div key={model.id} className="pointer-events-auto">
          <Model3DPlaceholder
            model={model}
            cellSize={cellSize}
            isSelected={selectedModelId === model.id}
            isDragging={dragState.isDragging && dragState.modelId === model.id}
            onClick={() => onModelSelect(model.id)}
            onDoubleClick={onSwitchTo3D}
            onDragStart={handleDragStart}
          />
        </div>
      ))}
    </div>
  );
}
