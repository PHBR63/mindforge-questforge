import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Pencil, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { NODE_TYPES, MindMapNodeData } from './types';

type MindMapNodeType = Node<{
  label: React.ReactNode;
  nodeData: MindMapNodeData;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isSelected: boolean;
}>;

function MindMapNodeComponent({ data, id }: NodeProps<MindMapNodeType>) {
  const { nodeData, onEdit, onDelete, onDuplicate, isSelected } = data;
  const nodeType = NODE_TYPES[nodeData.node_type as keyof typeof NODE_TYPES] || NODE_TYPES.idea;

  const nodeContent = (
    <div
      className={`
        relative cursor-pointer transition-all duration-200 group
        ${isSelected ? 'scale-105 z-10' : 'hover:scale-102'}
      `}
    >
      {/* Node card */}
      <div
        className={`
          relative rounded-lg shadow-lg p-3 min-w-[140px] max-w-[200px]
          border-2 transition-all
          ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        `}
        style={{
          background: nodeData.color || nodeType.color,
          borderColor: 'rgba(255,255,255,0.3)',
        }}
      >
        {/* Action buttons - appear on hover */}
        <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(id);
            }}
            title="Editar (ou clique duplo)"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(id);
            }}
            title="Duplicar (Ctrl+D)"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            title="Excluir (Delete)"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Icon */}
        <div className="absolute -top-3 -left-3 text-2xl bg-background rounded-full w-8 h-8 flex items-center justify-center shadow-md">
          {nodeType.icon}
        </div>

        {/* Title */}
        <div className="text-center pt-2">
          <h4 className="font-display font-bold text-sm text-white leading-tight">
            {nodeData.title}
          </h4>
          {nodeData.content && (
            <p className="text-xs text-white/80 mt-1 line-clamp-2">
              {nodeData.content}
            </p>
          )}
          <div className="text-xs mt-2 text-white/70 font-medium">
            {nodeType.label}
          </div>
        </div>
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-white !w-3 !h-3 !border-2 !border-gray-400"
      />
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {nodeContent}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit(id)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(id)}>
          <Copy className="h-4 w-4 mr-2" />
          Duplicar
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+D</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={() => onDelete(id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
          <span className="ml-auto text-xs text-muted-foreground">Del</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const MindMapNode = memo(MindMapNodeComponent);
