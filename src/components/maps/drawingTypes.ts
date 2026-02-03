export type DrawingTool = 'select' | 'brush' | 'eraser' | 'line' | 'rectangle' | 'circle' | 'fill';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface MapDrawing {
  id: string;
  map_id: string;
  user_id: string;
  layer: number | null;
  tool_type: string;
  color: string;
  brush_size: number | null;
  opacity: number | null;
  points: DrawingPoint[];
  is_visible: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MapLayer {
  id: string;
  map_id: string;
  user_id: string;
  name: string;
  layer_type: string;
  layer_order: number | null;
  is_visible: boolean | null;
  is_locked: boolean | null;
  opacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface DrawingState {
  isDrawing: boolean;
  currentTool: DrawingTool;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  currentPoints: DrawingPoint[];
  activeLayerId: string | null;
}

export const DRAWING_COLORS = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
  '#78350f',
  '#166534',
] as const;

export const BRUSH_SIZES = [
  { value: 2, label: 'Fino' },
  { value: 5, label: 'Pequeno' },
  { value: 10, label: 'Médio' },
  { value: 20, label: 'Grande' },
  { value: 40, label: 'Extra Grande' },
] as const;

export const DEFAULT_LAYERS = [
  { name: 'Fundo', layer_type: 'background', layer_order: 0 },
  { name: 'Terreno', layer_type: 'terrain', layer_order: 1 },
  { name: 'Objetos', layer_type: 'objects', layer_order: 2 },
  { name: 'Tokens', layer_type: 'tokens', layer_order: 3 },
  { name: 'Efeitos', layer_type: 'effects', layer_order: 4 },
] as const;
