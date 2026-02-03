import { memo } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import { CONNECTION_TYPES } from './types';

interface MindMapEdgeData {
  label?: string;
  connectionType?: string;
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

  const connectionType = CONNECTION_TYPES.find(
    (t) => t.value === (data as MindMapEdgeData)?.connectionType
  ) || CONNECTION_TYPES[0];

  const isAnimated = (data as MindMapEdgeData)?.connectionType === 'causes';

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
      {(data as MindMapEdgeData)?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-2 py-1 rounded text-xs font-medium bg-card border border-border shadow-sm"
          >
            {(data as MindMapEdgeData).label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const MindMapEdge = memo(MindMapEdgeComponent);
