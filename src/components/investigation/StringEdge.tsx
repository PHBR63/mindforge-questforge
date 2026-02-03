import { memo } from 'react';
import { EdgeProps, getBezierPath } from '@xyflow/react';

function StringEdgeComponent({
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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = (data?.color as string) || '#ef4444';
  const label = data?.label as string | undefined;

  return (
    <>
      {/* String shadow */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth={4}
        style={{
          filter: 'blur(2px)',
          transform: 'translate(2px, 2px)',
        }}
      />
      
      {/* Main string */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={selected ? 4 : 3}
        strokeLinecap="round"
        className="transition-all duration-200"
        style={{
          filter: selected ? 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' : undefined,
        }}
      />
      
      {/* Dashed overlay for texture */}
      <path
        d={edgePath}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={1}
        strokeDasharray="8 4"
      />
      
      {/* Label */}
      {label && (
        <text>
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            className="text-xs fill-white font-medium"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            }}
          >
            {label}
          </textPath>
        </text>
      )}
    </>
  );
}

export const StringEdge = memo(StringEdgeComponent);
