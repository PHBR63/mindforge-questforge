/**
 * LDtk (Level Designer Toolkit) JSON Parser
 * Parses LDtk project files and extracts map data, entities, and tilemaps
 * Documentation: https://ldtk.io/json/
 */

import { MapToken } from '../types';
import { MapAsset } from '../assetTypes';
import { MapDrawing, DrawingPoint } from '../drawingTypes';

// LDtk JSON Types
interface LDtkProject {
  jsonVersion: string;
  worldGridWidth?: number;
  worldGridHeight?: number;
  defaultGridSize: number;
  levels: LDtkLevel[];
  defs: LDtkDefinitions;
}

interface LDtkLevel {
  identifier: string;
  uid: number;
  worldX: number;
  worldY: number;
  worldDepth: number;
  pxWid: number;
  pxHei: number;
  bgColor?: string;
  bgRelPath?: string;
  layerInstances?: LDtkLayerInstance[];
}

interface LDtkDefinitions {
  layers: LDtkLayerDef[];
  entities: LDtkEntityDef[];
  tilesets: LDtkTilesetDef[];
}

interface LDtkLayerDef {
  identifier: string;
  uid: number;
  type: 'IntGrid' | 'Tiles' | 'Entities' | 'AutoLayer';
  gridSize: number;
}

interface LDtkEntityDef {
  identifier: string;
  uid: number;
  width: number;
  height: number;
  color: string;
}

interface LDtkTilesetDef {
  identifier: string;
  uid: number;
  relPath?: string;
  pxWid: number;
  pxHei: number;
  tileGridSize: number;
}

interface LDtkLayerInstance {
  __identifier: string;
  __type: string;
  __cWid: number;
  __cHei: number;
  __gridSize: number;
  levelId: number;
  layerDefUid: number;
  pxOffsetX: number;
  pxOffsetY: number;
  visible: boolean;
  intGridCsv?: number[];
  autoLayerTiles?: LDtkTile[];
  gridTiles?: LDtkTile[];
  entityInstances?: LDtkEntityInstance[];
}

interface LDtkTile {
  px: [number, number];
  src: [number, number];
  f: number; // flip flags
  t: number; // tile id
  d: number[];
}

interface LDtkEntityInstance {
  __identifier: string;
  __grid: [number, number];
  __pivot: [number, number];
  __tags: string[];
  __smartColor: string;
  __worldX?: number;
  __worldY?: number;
  defUid: number;
  px: [number, number];
  fieldInstances: LDtkFieldInstance[];
  width: number;
  height: number;
}

interface LDtkFieldInstance {
  __identifier: string;
  __value: unknown;
  __type: string;
}

// Parsed output types
export interface LDtkImportResult {
  success: boolean;
  error?: string;
  mapData?: {
    name: string;
    gridWidth: number;
    gridHeight: number;
    cellSize: number;
    backgroundColor: string;
  };
  tokens: Partial<MapToken>[];
  assets: Partial<MapAsset>[];
  drawings: Partial<MapDrawing>[];
  rawLevels: LDtkLevel[];
}

/**
 * Parse an LDtk JSON file and extract map data
 */
export function parseLDtkFile(jsonContent: string): LDtkImportResult {
  try {
    const project: LDtkProject = JSON.parse(jsonContent);
    
    if (!project.levels || project.levels.length === 0) {
      return {
        success: false,
        error: 'Nenhum nível encontrado no arquivo LDtk',
        tokens: [],
        assets: [],
        drawings: [],
        rawLevels: [],
      };
    }

    // Use the first level by default
    const level = project.levels[0];
    const cellSize = project.defaultGridSize || 16;
    
    const gridWidth = Math.ceil(level.pxWid / cellSize);
    const gridHeight = Math.ceil(level.pxHei / cellSize);

    const mapData = {
      name: level.identifier || 'Imported LDtk Map',
      gridWidth,
      gridHeight,
      cellSize: 40, // Normalize to our default cell size
      backgroundColor: level.bgColor || '#1a1a2e',
    };

    const tokens: Partial<MapToken>[] = [];
    const assets: Partial<MapAsset>[] = [];
    const drawings: Partial<MapDrawing>[] = [];

    // Process layer instances
    if (level.layerInstances) {
      for (const layer of level.layerInstances) {
        if (!layer.visible) continue;

        // Process entities
        if (layer.__type === 'Entities' && layer.entityInstances) {
          for (const entity of layer.entityInstances) {
            tokens.push(convertEntityToToken(entity, cellSize, mapData.cellSize));
          }
        }

        // Process IntGrid as drawings
        if (layer.__type === 'IntGrid' && layer.intGridCsv) {
          const gridDrawings = convertIntGridToDrawings(
            layer.intGridCsv,
            layer.__cWid,
            layer.__cHei,
            layer.__gridSize,
            cellSize,
            mapData.cellSize
          );
          drawings.push(...gridDrawings);
        }

        // Process Tiles as assets
        if ((layer.__type === 'Tiles' || layer.__type === 'AutoLayer') && 
            (layer.gridTiles || layer.autoLayerTiles)) {
          const tiles = layer.gridTiles || layer.autoLayerTiles || [];
          for (const tile of tiles) {
            assets.push(convertTileToAsset(tile, layer.__gridSize, cellSize, mapData.cellSize));
          }
        }
      }
    }

    return {
      success: true,
      mapData,
      tokens,
      assets,
      drawings,
      rawLevels: project.levels,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar arquivo LDtk',
      tokens: [],
      assets: [],
      drawings: [],
      rawLevels: [],
    };
  }
}

/**
 * Convert LDtk entity to MapToken
 */
function convertEntityToToken(
  entity: LDtkEntityInstance,
  sourceCellSize: number,
  targetCellSize: number
): Partial<MapToken> {
  const scale = targetCellSize / sourceCellSize;
  
  // Determine token type from entity identifier
  let tokenType = 'marker';
  const identifier = entity.__identifier.toLowerCase();
  if (identifier.includes('player') || identifier.includes('hero')) {
    tokenType = 'character';
  } else if (identifier.includes('enemy') || identifier.includes('monster')) {
    tokenType = 'enemy';
  } else if (identifier.includes('npc')) {
    tokenType = 'npc';
  } else if (identifier.includes('item') || identifier.includes('object')) {
    tokenType = 'object';
  }

  // Extract notes from field instances
  const notes = entity.fieldInstances
    .filter(f => typeof f.__value === 'string')
    .map(f => `${f.__identifier}: ${f.__value}`)
    .join('\n');

  return {
    name: entity.__identifier,
    token_type: tokenType,
    color: entity.__smartColor || '#8b5cf6',
    size: Math.max(1, Math.round(entity.width / sourceCellSize)),
    position_x: Math.round((entity.px[0] / sourceCellSize) * scale / targetCellSize),
    position_y: Math.round((entity.px[1] / sourceCellSize) * scale / targetCellSize),
    layer: 3,
    is_visible: true,
    notes: notes || null,
  };
}

/**
 * Convert LDtk IntGrid to MapDrawings (for terrain/collision)
 */
function convertIntGridToDrawings(
  intGridCsv: number[],
  width: number,
  height: number,
  gridSize: number,
  sourceCellSize: number,
  targetCellSize: number
): Partial<MapDrawing>[] {
  const drawings: Partial<MapDrawing>[] = [];
  const scale = targetCellSize / sourceCellSize;
  
  // Group cells by value for efficient drawing
  const valueGroups = new Map<number, DrawingPoint[]>();
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = intGridCsv[y * width + x];
      if (value > 0) {
        const points = valueGroups.get(value) || [];
        points.push({
          x: (x * gridSize * scale) / targetCellSize,
          y: (y * gridSize * scale) / targetCellSize,
        });
        valueGroups.set(value, points);
      }
    }
  }

  // Create a drawing for each value group
  const colors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  let colorIndex = 0;

  for (const [value, points] of valueGroups) {
    // Create rectangle drawings for each cell
    for (const point of points) {
      drawings.push({
        tool_type: 'rectangle',
        color: colors[colorIndex % colors.length],
        brush_size: 1,
        opacity: 0.6,
        points: [
          point,
          { x: point.x + 1, y: point.y },
          { x: point.x + 1, y: point.y + 1 },
          { x: point.x, y: point.y + 1 },
        ],
        layer: 1,
        is_visible: true,
      });
    }
    colorIndex++;
  }

  return drawings;
}

/**
 * Convert LDtk Tile to MapAsset
 */
function convertTileToAsset(
  tile: LDtkTile,
  gridSize: number,
  sourceCellSize: number,
  targetCellSize: number
): Partial<MapAsset> {
  const scale = targetCellSize / sourceCellSize;
  
  return {
    asset_type: 'tile',
    asset_key: `ldtk_tile_${tile.t}`,
    position_x: (tile.px[0] * scale) / targetCellSize,
    position_y: (tile.px[1] * scale) / targetCellSize,
    rotation: 0,
    scale: 1,
    layer: 1,
    is_visible: true,
  };
}

/**
 * Get available levels from LDtk project
 */
export function getLDtkLevels(jsonContent: string): { id: number; name: string }[] {
  try {
    const project: LDtkProject = JSON.parse(jsonContent);
    return project.levels.map(level => ({
      id: level.uid,
      name: level.identifier,
    }));
  } catch {
    return [];
  }
}

/**
 * Parse a specific level from LDtk project
 */
export function parseLDtkLevel(jsonContent: string, levelId: number): LDtkImportResult {
  try {
    const project: LDtkProject = JSON.parse(jsonContent);
    const levelIndex = project.levels.findIndex(l => l.uid === levelId);
    
    if (levelIndex === -1) {
      return parseLDtkFile(jsonContent);
    }

    // Temporarily swap the target level to first position
    const reordered = [...project.levels];
    [reordered[0], reordered[levelIndex]] = [reordered[levelIndex], reordered[0]];
    
    return parseLDtkFile(JSON.stringify({ ...project, levels: reordered }));
  } catch {
    return parseLDtkFile(jsonContent);
  }
}
