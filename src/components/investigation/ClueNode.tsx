import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { InvestigationClue, CLUE_TYPES } from './types';
import { Pin } from 'lucide-react';

type ClueNodeData = {
  clue: InvestigationClue;
  onSelect: (id: string) => void;
  isSelected: boolean;
};

type ClueNodeType = Node<ClueNodeData, 'clue'>;

function ClueNodeComponent({ data, id }: NodeProps<ClueNodeType>) {
  const { clue, onSelect, isSelected } = data;
  
  const clueType = CLUE_TYPES.find(t => t.value === clue.clue_type) || CLUE_TYPES[0];
  
  return (
    <div
      onClick={() => onSelect(id)}
      className={`
        relative cursor-pointer transition-all duration-200
        ${isSelected ? 'scale-105 z-10' : 'hover:scale-102'}
      `}
    >
      {/* Pin on top */}
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
        style={{ color: clue.color || clueType.color }}
      >
        <Pin className="w-6 h-6 fill-current drop-shadow-lg" />
      </div>
      
      {/* Card */}
      <div
        className={`
          relative bg-amber-50 dark:bg-amber-100 rounded shadow-lg
          border-2 transform rotate-1
          min-w-[120px] max-w-[180px] p-3 pt-4
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
        style={{ 
          borderColor: clue.color || clueType.color,
          boxShadow: '4px 4px 8px rgba(0,0,0,0.3)',
        }}
      >
        {/* Clue type icon */}
        <div className="absolute -top-1 -right-1 text-lg">
          {clueType.icon}
        </div>
        
        {/* Image if exists */}
        {clue.image_url && (
          <div className="mb-2 -mx-1">
            <img 
              src={clue.image_url} 
              alt={clue.title}
              className="w-full h-20 object-cover rounded border border-amber-200"
            />
          </div>
        )}
        
        {/* Title */}
        <h4 className="font-bold text-sm text-gray-800 leading-tight mb-1">
          {clue.title}
        </h4>
        
        {/* Content preview */}
        {clue.content && (
          <p className="text-xs text-gray-600 line-clamp-3">
            {clue.content}
          </p>
        )}
        
        {/* Type badge */}
        <div 
          className="mt-2 text-xs px-2 py-0.5 rounded-full inline-block text-white font-medium"
          style={{ backgroundColor: clue.color || clueType.color }}
        >
          {clueType.label}
        </div>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
}

export const ClueNode = memo(ClueNodeComponent);
