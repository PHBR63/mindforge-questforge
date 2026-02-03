export interface MapData {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  description: string | null;
  grid_width: number;
  grid_height: number;
  cell_size: number;
  background_color: string | null;
  background_image_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MapToken {
  id: string;
  map_id: string;
  user_id: string;
  name: string;
  token_type: string | null;
  image_url: string | null;
  color: string | null;
  size: number | null;
  position_x: number;
  position_y: number;
  layer: number | null;
  is_visible: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenDragState {
  isDragging: boolean;
  tokenId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export const TOKEN_TYPES = [
  { value: 'character', label: 'Personagem', color: '#22c55e' },
  { value: 'enemy', label: 'Inimigo', color: '#ef4444' },
  { value: 'npc', label: 'NPC', color: '#3b82f6' },
  { value: 'object', label: 'Objeto', color: '#f59e0b' },
  { value: 'marker', label: 'Marcador', color: '#8b5cf6' },
] as const;

export const TOKEN_SIZES = [
  { value: 1, label: 'Pequeno (1x1)' },
  { value: 2, label: 'Médio (2x2)' },
  { value: 3, label: 'Grande (3x3)' },
  { value: 4, label: 'Enorme (4x4)' },
] as const;
