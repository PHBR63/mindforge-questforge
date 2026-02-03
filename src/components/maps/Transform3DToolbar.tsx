import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Move, RotateCcw, Maximize2, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransformMode = 'translate' | 'rotate' | 'scale';

interface Transform3DToolbarProps {
  mode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
  hasSelection: boolean;
  onFocusSelected?: () => void;
}

export function Transform3DToolbar({
  mode,
  onModeChange,
  hasSelection,
  onFocusSelected,
}: Transform3DToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-lg border border-border p-1 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'translate' ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 w-8 p-0', !hasSelection && 'opacity-50')}
              onClick={() => onModeChange('translate')}
              disabled={!hasSelection}
            >
              <Move className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Mover (G)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'rotate' ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 w-8 p-0', !hasSelection && 'opacity-50')}
              onClick={() => onModeChange('rotate')}
              disabled={!hasSelection}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Rotacionar (R)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={mode === 'scale' ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-8 w-8 p-0', !hasSelection && 'opacity-50')}
              onClick={() => onModeChange('scale')}
              disabled={!hasSelection}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Escalar (S)</TooltipContent>
        </Tooltip>

        {onFocusSelected && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn('h-8 w-8 p-0', !hasSelection && 'opacity-50')}
                  onClick={onFocusSelected}
                  disabled={!hasSelection}
                >
                  <Focus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Focar no modelo (F)</TooltipContent>
            </Tooltip>
          </>
        )}

        {hasSelection && (
          <div className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wide">
            {mode === 'translate' && 'Mover'}
            {mode === 'rotate' && 'Rotacionar'}
            {mode === 'scale' && 'Escalar'}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
