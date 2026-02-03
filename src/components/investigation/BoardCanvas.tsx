import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ClueNode } from './ClueNode';
import { StringEdge } from './StringEdge';
import { InvestigationClue, InvestigationConnection } from './types';

interface BoardCanvasProps {
  clues: InvestigationClue[];
  connections: InvestigationConnection[];
  selectedClueId: string | null;
  onClueSelect: (id: string | null) => void;
  onClueMove: (id: string, x: number, y: number) => void;
  onConnectionCreate: (sourceId: string, targetId: string) => void;
  onConnectionDelete: (id: string) => void;
  backgroundColor: string;
}

const nodeTypes = {
  clue: ClueNode,
};

const edgeTypes = {
  string: StringEdge,
};

export function BoardCanvas({
  clues,
  connections,
  selectedClueId,
  onClueSelect,
  onClueMove,
  onConnectionCreate,
  onConnectionDelete,
  backgroundColor,
}: BoardCanvasProps) {
  const initialNodes: Node[] = useMemo(() => 
    clues.map((clue) => ({
      id: clue.id,
      type: 'clue',
      position: { x: clue.position_x, y: clue.position_y },
      data: {
        clue,
        onSelect: onClueSelect,
        isSelected: selectedClueId === clue.id,
      },
    })),
    [clues, selectedClueId, onClueSelect]
  );

  const initialEdges: Edge[] = useMemo(() =>
    connections.map((conn) => ({
      id: conn.id,
      source: conn.source_clue_id,
      target: conn.target_clue_id,
      type: 'string',
      data: {
        color: conn.color,
        label: conn.label,
      },
    })),
    [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes when clues change
  useMemo(() => {
    setNodes(
      clues.map((clue) => ({
        id: clue.id,
        type: 'clue',
        position: { x: clue.position_x, y: clue.position_y },
        data: {
          clue,
          onSelect: onClueSelect,
          isSelected: selectedClueId === clue.id,
        },
      }))
    );
  }, [clues, selectedClueId, onClueSelect, setNodes]);

  // Sync edges when connections change
  useMemo(() => {
    setEdges(
      connections.map((conn) => ({
        id: conn.id,
        source: conn.source_clue_id,
        target: conn.target_clue_id,
        type: 'string',
        data: {
          color: conn.color,
          label: conn.label,
        },
      }))
    );
  }, [connections, setEdges]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    
    // Handle position changes
    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        onClueMove(change.id, change.position.x, change.position.y);
      }
    });
  }, [onNodesChange, onClueMove]);

  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChange(changes);
    
    // Handle edge deletions
    changes.forEach((change) => {
      if (change.type === 'remove') {
        onConnectionDelete(change.id);
      }
    });
  }, [onEdgesChange, onConnectionDelete]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target && params.source !== params.target) {
      onConnectionCreate(params.source, params.target);
    }
  }, [onConnectionCreate]);

  const onPaneClick = useCallback(() => {
    onClueSelect(null);
  }, [onClueSelect]);

  return (
    <div className="flex-1 h-full" style={{ backgroundColor }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'string' }}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
        className="investigation-board"
      >
        <Background 
          color="rgba(255,255,255,0.05)" 
          gap={40} 
          size={1}
        />
        <Controls className="!bg-card !border-border" />
        <MiniMap 
          className="!bg-card !border-border"
          nodeColor={(node) => {
            const clue = (node.data as any)?.clue as InvestigationClue;
            return clue?.color || '#ef4444';
          }}
        />
      </ReactFlow>
    </div>
  );
}
