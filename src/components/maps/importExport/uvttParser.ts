/**
 * Universal VTT (.uvtt) Parser
 * Parses Universal VTT format files used by DungeonFog, DungeonDraft, and other tools
 * Specification: https://arkenforge.com/universal-vtt-file-format/
 */

import { MapToken } from '../types';
import { MapDrawing, DrawingPoint } from '../drawingTypes';

// Universal VTT Types
interface UVTTFile {
  format: number; // Format version (typically 0.3)
  resolution: {
    map_origin: { x: number; y: number };
    map_size: { x: number; y: number };
    pixels_per_grid: number;
  };
  image?: string; // Base64 encoded image
  line_of_sight?: UVTTLineOfSight[];
  portals?: UVTTPortal[];
  lights?: UVTTLight[];
  environment?: UVTTEnvironment;
}

interface UVTTLineOfSight {
  // Array of points forming a wall segment
  points: Array<{ x: number; y: number }>;
}

interface UVTTPortal {
  position: { x: number; y: number };
  bounds: Array<{ x: number; y: number }>;
  rotation: number;
  closed: boolean;
  freestanding: boolean;
}

interface UVTTLight {
  position: { x: number; y: number };
  range: number;
  intensity: number;
  color: string;
  shadows: boolean;
}

interface UVTTEnvironment {
  baked_lighting: boolean;
  ambient_light?: string;
}

// Wall data for conversion
export interface ImportedWall {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  height: number;
  thickness: number;
  color: string;
}

// Portal/Door data
export interface ImportedPortal {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  isOpen: boolean;
  portalType: 'door' | 'window';
}

// Light data
export interface ImportedLight {
  positionX: number;
  positionY: number;
  range: number;
  intensity: number;
  color: string;
  castShadows: boolean;
}

// Parsed output
export interface UVTTImportResult {
  success: boolean;
  error?: string;
  mapData?: {
    name: string;
    gridWidth: number;
    gridHeight: number;
    cellSize: number;
    backgroundColor: string;
    backgroundImageBase64?: string;
  };
  walls: ImportedWall[];
  portals: ImportedPortal[];
  lights: ImportedLight[];
  tokens: Partial<MapToken>[];
  drawings: Partial<MapDrawing>[];
}

/**
 * Parse a Universal VTT file
 */
export function parseUVTTFile(content: string | ArrayBuffer, filename: string): UVTTImportResult {
  try {
    let uvttData: UVTTFile;
    
    if (typeof content === 'string') {
      uvttData = JSON.parse(content);
    } else {
      const decoder = new TextDecoder();
      uvttData = JSON.parse(decoder.decode(content));
    }

    if (!uvttData.resolution) {
      return {
        success: false,
        error: 'Arquivo UVTT inválido: informações de resolução ausentes',
        walls: [],
        portals: [],
        lights: [],
        tokens: [],
        drawings: [],
      };
    }

    const pixelsPerGrid = uvttData.resolution.pixels_per_grid || 140;
    const mapSizeX = uvttData.resolution.map_size.x;
    const mapSizeY = uvttData.resolution.map_size.y;
    
    const gridWidth = Math.ceil(mapSizeX);
    const gridHeight = Math.ceil(mapSizeY);

    const mapData = {
      name: filename.replace(/\.(uvtt|dd2vtt)$/i, '') || 'Imported VTT Map',
      gridWidth,
      gridHeight,
      cellSize: 40,
      backgroundColor: uvttData.environment?.ambient_light || '#1a1a2e',
      backgroundImageBase64: uvttData.image,
    };

    // Parse walls from line_of_sight
    const walls: ImportedWall[] = [];
    if (uvttData.line_of_sight) {
      for (const los of uvttData.line_of_sight) {
        const points = los.points || los as any;
        if (Array.isArray(points) && points.length >= 2) {
          for (let i = 0; i < points.length - 1; i++) {
            walls.push({
              startX: points[i].x,
              startY: points[i].y,
              endX: points[i + 1].x,
              endY: points[i + 1].y,
              height: 3,
              thickness: 0.2,
              color: '#6b7280',
            });
          }
        }
      }
    }

    // Parse portals (doors/windows)
    const portals: ImportedPortal[] = [];
    if (uvttData.portals) {
      for (const portal of uvttData.portals) {
        const bounds = portal.bounds || [];
        let width = 1;
        let height = 2;

        if (bounds.length >= 2) {
          const dx = Math.abs(bounds[1].x - bounds[0].x);
          const dy = Math.abs(bounds[1].y - bounds[0].y);
          width = Math.max(dx, 0.5);
          height = Math.max(dy, 0.5);
        }

        portals.push({
          positionX: portal.position.x,
          positionY: portal.position.y,
          width,
          height,
          rotation: portal.rotation || 0,
          isOpen: !portal.closed,
          portalType: portal.freestanding ? 'window' : 'door',
        });
      }
    }

    // Parse lights
    const lights: ImportedLight[] = [];
    if (uvttData.lights) {
      for (const light of uvttData.lights) {
        lights.push({
          positionX: light.position.x,
          positionY: light.position.y,
          range: light.range || 5,
          intensity: light.intensity || 1,
          color: light.color || '#ffcc00',
          castShadows: light.shadows !== false,
        });
      }
    }

    // Convert walls to drawings for 2D visualization
    const drawings: Partial<MapDrawing>[] = walls.map(wall => ({
      tool_type: 'line',
      color: '#6b7280',
      brush_size: 3,
      opacity: 1,
      points: [
        { x: wall.startX, y: wall.startY },
        { x: wall.endX, y: wall.endY },
      ],
      layer: 2,
      is_visible: true,
    }));

    return {
      success: true,
      mapData,
      walls,
      portals,
      lights,
      tokens: [],
      drawings,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo UVTT',
      walls: [],
      portals: [],
      lights: [],
      tokens: [],
      drawings: [],
    };
  }
}

/**
 * Export map data to Universal VTT format
 */
export interface ExportToUVTTOptions {
  mapName: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  walls: Array<{
    start_x: number;
    start_y: number;
    end_x: number;
    end_y: number;
  }>;
  portals?: Array<{
    position_x: number;
    position_y: number;
    width: number;
    isOpen: boolean;
    portalType: string;
  }>;
  lights?: Array<{
    position_x: number;
    position_y: number;
    range: number;
    intensity: number;
    color: string;
    cast_shadows: boolean;
  }>;
  backgroundImage?: string; // Base64 or data URL
  pixelsPerGrid?: number;
}

export function exportToUVTT(options: ExportToUVTTOptions): string {
  const pixelsPerGrid = options.pixelsPerGrid || 140;
  
  const uvttFile: UVTTFile = {
    format: 0.3,
    resolution: {
      map_origin: { x: 0, y: 0 },
      map_size: { x: options.gridWidth, y: options.gridHeight },
      pixels_per_grid: pixelsPerGrid,
    },
    line_of_sight: [],
    portals: [],
    lights: [],
    environment: {
      baked_lighting: false,
      ambient_light: '#404040',
    },
  };

  // Convert walls to line_of_sight
  if (options.walls && options.walls.length > 0) {
    uvttFile.line_of_sight = options.walls.map(wall => ({
      points: [
        { x: wall.start_x, y: wall.start_y },
        { x: wall.end_x, y: wall.end_y },
      ],
    }));
  }

  // Convert portals
  if (options.portals && options.portals.length > 0) {
    uvttFile.portals = options.portals.map(portal => ({
      position: { x: portal.position_x, y: portal.position_y },
      bounds: [
        { x: portal.position_x - portal.width / 2, y: portal.position_y },
        { x: portal.position_x + portal.width / 2, y: portal.position_y },
      ],
      rotation: 0,
      closed: !portal.isOpen,
      freestanding: portal.portalType === 'window',
    }));
  }

  // Convert lights
  if (options.lights && options.lights.length > 0) {
    uvttFile.lights = options.lights.map(light => ({
      position: { x: light.position_x, y: light.position_y },
      range: light.range,
      intensity: light.intensity,
      color: light.color,
      shadows: light.cast_shadows,
    }));
  }

  // Add background image if provided
  if (options.backgroundImage) {
    // Remove data URL prefix if present
    uvttFile.image = options.backgroundImage.replace(/^data:image\/\w+;base64,/, '');
  }

  return JSON.stringify(uvttFile, null, 2);
}

/**
 * Validate if content is a valid UVTT file
 */
export function isValidUVTT(content: string): boolean {
  try {
    const data = JSON.parse(content);
    return (
      typeof data.format === 'number' &&
      data.resolution &&
      typeof data.resolution.map_size === 'object' &&
      typeof data.resolution.pixels_per_grid === 'number'
    );
  } catch {
    return false;
  }
}
