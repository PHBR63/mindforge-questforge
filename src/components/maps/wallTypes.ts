// Types for the Advanced Wall Editor

export interface MapFloor {
  id: string;
  map_id: string;
  user_id: string;
  name: string;
  floor_number: number;
  height: number;
  floor_plan_url: string | null;
  floor_plan_opacity: number;
  floor_plan_scale: number;
  floor_plan_offset_x: number;
  floor_plan_offset_y: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MapWall {
  id: string;
  map_id: string;
  floor_id: string;
  user_id: string;
  start_x: number;
  start_y: number;
  end_x: number;
  end_y: number;
  height: number;
  thickness: number;
  color: string;
  texture: string | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface MapWallOpening {
  id: string;
  wall_id: string;
  user_id: string;
  opening_type: 'door' | 'window' | 'archway';
  position_along_wall: number; // 0-1, percentage along wall
  width: number;
  height: number;
  elevation: number; // Height from floor
  color: string | null;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface MapLight {
  id: string;
  map_id: string;
  floor_id: string;
  user_id: string;
  light_type: 'point' | 'spot' | 'ambient';
  position_x: number;
  position_y: number;
  position_z: number;
  color: string;
  intensity: number;
  range: number;
  cast_shadows: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export type WallEditorTool = 
  | 'select' 
  | 'wall' 
  | 'door' 
  | 'window' 
  | 'archway'
  | 'light' 
  | 'erase'
  | 'pan';

export interface WallEditorState {
  currentTool: WallEditorTool;
  wallHeight: number;
  wallThickness: number;
  wallColor: string;
  openingWidth: number;
  openingHeight: number;
  lightType: 'point' | 'spot' | 'ambient';
  lightColor: string;
  lightIntensity: number;
  lightRange: number;
  snapToGrid: boolean;
  showMeasurements: boolean;
  measurementUnit: 'meters' | 'feet';
}

export const WALL_COLORS = [
  { value: '#808080', label: 'Pedra Cinza' },
  { value: '#8B4513', label: 'Madeira Escura' },
  { value: '#D2691E', label: 'Madeira Clara' },
  { value: '#2F4F4F', label: 'Pedra Escura' },
  { value: '#F5DEB3', label: 'Arenito' },
  { value: '#DC143C', label: 'Tijolo Vermelho' },
  { value: '#FFFFFF', label: 'Reboco Branco' },
  { value: '#1C1C1C', label: 'Obsidiana' },
];

export const LIGHT_PRESETS = [
  { type: 'point', color: '#FFA500', intensity: 1.0, label: 'Tocha' },
  { type: 'point', color: '#4169E1', intensity: 0.8, label: 'Luz Mágica' },
  { type: 'point', color: '#90EE90', intensity: 0.6, label: 'Luz Encantada' },
  { type: 'point', color: '#FFFFFF', intensity: 1.2, label: 'Luz Brilhante' },
  { type: 'ambient', color: '#87CEEB', intensity: 0.3, label: 'Luz do Dia' },
  { type: 'ambient', color: '#191970', intensity: 0.1, label: 'Luz da Lua' },
];

export const DEFAULT_WALL_EDITOR_STATE: WallEditorState = {
  currentTool: 'select',
  wallHeight: 3.0,
  wallThickness: 0.2,
  wallColor: '#808080',
  openingWidth: 1.0,
  openingHeight: 2.0,
  lightType: 'point',
  lightColor: '#FFA500',
  lightIntensity: 1.0,
  lightRange: 10.0,
  snapToGrid: true,
  showMeasurements: true,
  measurementUnit: 'meters',
};

// Helper to convert between meters and feet
export function convertUnit(value: number, from: 'meters' | 'feet', to: 'meters' | 'feet'): number {
  if (from === to) return value;
  if (from === 'meters' && to === 'feet') return value * 3.28084;
  return value / 3.28084;
}

// Helper to calculate wall length
export function calculateWallLength(wall: MapWall): number {
  const dx = wall.end_x - wall.start_x;
  const dy = wall.end_y - wall.start_y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Helper to get wall angle
export function calculateWallAngle(wall: MapWall): number {
  return Math.atan2(wall.end_y - wall.start_y, wall.end_x - wall.start_x);
}
