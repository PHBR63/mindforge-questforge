/**
 * Map Import/Export utilities index
 * Centralized exports for all import/export functionality
 */

// LDtk parser
export {
  parseLDtkFile,
  parseLDtkLevel,
  getLDtkLevels,
  type LDtkImportResult,
} from './ldtkParser';

// Universal VTT parser
export {
  parseUVTTFile,
  exportToUVTT,
  isValidUVTT,
  type UVTTImportResult,
  type ImportedWall,
  type ImportedPortal,
  type ImportedLight,
  type ExportToUVTTOptions,
} from './uvttParser';

// File type detection
export type ImportFormat = 'ldtk' | 'uvtt' | 'json' | 'unknown';

export function detectImportFormat(filename: string, content?: string): ImportFormat {
  const extension = filename.toLowerCase().split('.').pop();
  
  if (extension === 'ldtk') {
    return 'ldtk';
  }
  
  if (extension === 'uvtt' || extension === 'dd2vtt') {
    return 'uvtt';
  }
  
  if (extension === 'json' && content) {
    try {
      const data = JSON.parse(content);
      
      // Check for LDtk format markers
      if (data.jsonVersion && data.levels && Array.isArray(data.levels)) {
        return 'ldtk';
      }
      
      // Check for UVTT format markers
      if (data.format && data.resolution && data.resolution.pixels_per_grid) {
        return 'uvtt';
      }
      
      // Check for our own JSON format
      if (data.version && data.map && data.exportedAt) {
        return 'json';
      }
    } catch {
      return 'unknown';
    }
  }
  
  return extension === 'json' ? 'json' : 'unknown';
}

// Supported file extensions
export const SUPPORTED_IMPORT_EXTENSIONS = ['.ldtk', '.uvtt', '.dd2vtt', '.json'];
export const SUPPORTED_IMPORT_ACCEPT = '.ldtk,.uvtt,.dd2vtt,.json,application/json';
