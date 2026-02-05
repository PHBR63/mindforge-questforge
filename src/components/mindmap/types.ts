import { Node, Edge } from '@xyflow/react';

export interface MindMapNodeData {
  id: string;
  campaign_id: string;
  user_id: string;
  title: string;
  content: string | null;
  node_type: string | null;
  color: string | null;
  position_x: number | null;
  position_y: number | null;
  entity_id: string | null;
  entity_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface MindMapConnection {
  id: string;
  campaign_id: string;
  user_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
  connection_type: string | null;
  created_at: string;
}

export const NODE_TYPES = {
  idea: { label: 'Ideia', color: '#3b82f6', icon: '💡' },
  npc: { label: 'NPC', color: '#22c55e', icon: '👤' },
  location: { label: 'Local', color: '#f59e0b', icon: '📍' },
  quest: { label: 'Missão', color: '#ef4444', icon: '⚔️' },
  faction: { label: 'Facção', color: '#8b5cf6', icon: '🏴' },
  event: { label: 'Evento', color: '#ec4899', icon: '📅' },
  item: { label: 'Item', color: '#06b6d4', icon: '🎒' },
} as const;

export const CONNECTION_TYPES = [
  { value: 'default', label: 'Padrão', color: '#888888' },
  { value: 'causes', label: 'Causa', color: '#ef4444' },
  { value: 'leads_to', label: 'Leva a', color: '#22c55e' },
  { value: 'related', label: 'Relacionado', color: '#3b82f6' },
  { value: 'opposes', label: 'Opõe', color: '#f59e0b' },
  { value: 'supports', label: 'Apoia', color: '#8b5cf6' },
] as const;

export type NodeType = keyof typeof NODE_TYPES;
export type ConnectionType = typeof CONNECTION_TYPES[number]['value'];

export interface MindMapNode extends Node {
  data: {
    label: React.ReactNode;
    nodeData: MindMapNodeData;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    isSelected: boolean;
  };
}

export interface MindMapEdge extends Edge {
  data?: {
    label?: string;
    connectionType?: ConnectionType;
  };
}
