import { memo } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONNECTION_TYPES } from './types';

interface MindMapEdgeData {
  label?: string;
  connectionType?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

function MindMapEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as MindMapEdgeData | undefined;

  const connectionType = CONNECTION_TYPES.find(
    (t) => t.value === edgeData?.connectionType
  ) || CONNECTION_TYPES[0];

  const isAnimated = edgeData?.connectionType === 'causes';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: connectionType.color,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: isAnimated ? '5 5' : undefined,
        }}
        className={isAnimated ? 'animated-edge' : ''}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="group flex items-center gap-1"
        >
          {/* Label text */}
          {edgeData?.label && (
            <div className="px-2 py-1 rounded text-xs font-medium bg-card border border-border shadow-sm">
              {edgeData.label}
            </div>
          )}

          {/* Hover action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-5 w-5 rounded-full shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                edgeData?.onEdit?.(id);
              }}
              title="Editar conexão"
            >
              <Pencil className="h-2.5 w-2.5" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-5 w-5 rounded-full shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                edgeData?.onDelete?.(id);
              }}
              title="Excluir conexão"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </Button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const MindMapEdge = memo(MindMapEdgeComponent);
