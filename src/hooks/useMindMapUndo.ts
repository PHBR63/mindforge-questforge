import { useRef, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { MindMapNodeData } from '@/components/mindmap/types';

export type UndoAction =
  | { type: 'create_node'; nodeId: string; edgeIds?: string[] }
  | { type: 'delete_node'; nodeData: MindMapNodeData; position: { x: number; y: number }; edges: { id: string; source: string; target: string; label?: string | null; connectionType?: string | null }[] }
  | { type: 'move_node'; nodeId: string; oldPosition: { x: number; y: number }; newPosition: { x: number; y: number } }
  | { type: 'create_edge'; edgeId: string }
  | { type: 'delete_edge'; edgeData: { id: string; source: string; target: string; label?: string | null; connection_type?: string | null; campaign_id: string; user_id: string } }
  | { type: 'update_node'; nodeId: string; oldData: Partial<MindMapNodeData> }
  | { type: 'batch_create_nodes'; nodeIds: string[] }
  | { type: 'batch_delete_nodes'; items: { nodeData: MindMapNodeData; position: { x: number; y: number }; edges: { id: string; source: string; target: string; label?: string | null; connectionType?: string | null; campaign_id: string; user_id: string }[] }[] };

const MAX_UNDO_STACK = 50;

export function useMindMapUndo() {
  const undoStack = useRef<UndoAction[]>([]);

  const pushAction = useCallback((action: UndoAction) => {
    undoStack.current.push(action);
    if (undoStack.current.length > MAX_UNDO_STACK) {
      undoStack.current.shift();
    }
  }, []);

  const popAction = useCallback((): UndoAction | undefined => {
    return undoStack.current.pop();
  }, []);

  const canUndo = useCallback(() => undoStack.current.length > 0, []);

  const clearStack = useCallback(() => {
    undoStack.current = [];
  }, []);

  return { pushAction, popAction, canUndo, clearStack };
}
