// Types for 3D Models in Map Builder
import type { Json } from '@/integrations/supabase/types';

export interface Map3DModel {
  id: string;
  map_id: string;
  user_id: string;
  name: string;
  file_url: string;
  thumbnail_url: string | null;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale: number;
  layer: number;
  is_visible: boolean;
  animation_name: string | null;
  animation_playing: boolean;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface Model3DTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}

// Supported 3D file formats
export const SUPPORTED_3D_FORMATS = ['.gltf', '.glb'];

export const MAX_3D_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function isSupported3DFormat(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUPPORTED_3D_FORMATS.includes(ext);
}

export function validate3DFile(file: File): { valid: boolean; error?: string } {
  if (!isSupported3DFormat(file.name)) {
    return {
      valid: false,
      error: `Formato não suportado. Use: ${SUPPORTED_3D_FORMATS.join(', ')}`,
    };
  }

  if (file.size > MAX_3D_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${MAX_3D_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}
