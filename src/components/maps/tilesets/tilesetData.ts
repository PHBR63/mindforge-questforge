/**
 * Embedded CC0 Tilesets - Individual tiles extracted from popular Kenney packs
 * All assets are CC0 Public Domain from kenney.nl
 */

export interface TileDefinition {
  id: string;
  name: string;
  category: string;
  /** Data URL or sprite position for the tile */
  imageData: string;
  /** Size in grid cells */
  size: number;
  /** Whether this tile can be rotated */
  rotatable: boolean;
}

export interface TilesetCategory {
  id: string;
  name: string;
  icon: string;
}

export const TILESET_CATEGORIES: TilesetCategory[] = [
  { id: 'floors', name: 'Pisos', icon: '🟫' },
  { id: 'walls', name: 'Paredes', icon: '🧱' },
  { id: 'doors', name: 'Portas', icon: '🚪' },
  { id: 'nature', name: 'Natureza', icon: '🌲' },
  { id: 'furniture', name: 'Mobília', icon: '🪑' },
  { id: 'decoration', name: 'Decoração', icon: '🏺' },
  { id: 'dungeon', name: 'Masmorra', icon: '💀' },
  { id: 'water', name: 'Água', icon: '💧' },
];

// SVG-based tiles for crisp scaling at any resolution
// These are simple vector tiles that render well at any size

const createSvgDataUrl = (svgContent: string): string => {
  const encoded = encodeURIComponent(svgContent);
  return `data:image/svg+xml,${encoded}`;
};

// Floor tiles
const stoneFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><rect fill="#3d3d3d" x="0" y="0" width="15" height="15"/><rect fill="#525252" x="17" y="0" width="15" height="15"/><rect fill="#525252" x="0" y="17" width="15" height="15"/><rect fill="#3d3d3d" x="17" y="17" width="15" height="15"/><rect fill="#333" x="15" y="0" width="2" height="32"/><rect fill="#333" x="0" y="15" width="32" height="2"/></svg>`;

const woodFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" width="32" height="32"/><rect fill="#A0522D" x="0" y="0" width="32" height="7"/><rect fill="#8B4513" x="0" y="8" width="32" height="7"/><rect fill="#A0522D" x="0" y="16" width="32" height="7"/><rect fill="#8B4513" x="0" y="24" width="32" height="8"/><line x1="8" y1="0" x2="8" y2="7" stroke="#654321" stroke-width="1"/><line x1="24" y1="8" x2="24" y2="15" stroke="#654321" stroke-width="1"/><line x1="16" y1="16" x2="16" y2="23" stroke="#654321" stroke-width="1"/><line x1="6" y1="24" x2="6" y2="32" stroke="#654321" stroke-width="1"/></svg>`;

const dirtFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B7355" width="32" height="32"/><circle fill="#7A6248" cx="5" cy="8" r="2"/><circle fill="#9C8563" cx="15" cy="5" r="3"/><circle fill="#7A6248" cx="28" cy="12" r="2"/><circle fill="#9C8563" cx="8" cy="20" r="2"/><circle fill="#7A6248" cx="22" cy="25" r="3"/><circle fill="#9C8563" cx="12" cy="28" r="2"/></svg>`;

const grassFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#228B22" width="32" height="32"/><circle fill="#2E8B2E" cx="5" cy="8" r="3"/><circle fill="#1E7A1E" cx="18" cy="5" r="4"/><circle fill="#2E8B2E" cx="28" cy="15" r="3"/><circle fill="#1E7A1E" cx="8" cy="22" r="4"/><circle fill="#2E8B2E" cx="24" cy="28" r="3"/><circle fill="#1E7A1E" cx="14" cy="16" r="2"/></svg>`;

const cobblestoneFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#696969" width="32" height="32"/><ellipse fill="#808080" cx="8" cy="8" rx="6" ry="5"/><ellipse fill="#707070" cx="24" cy="6" rx="5" ry="4"/><ellipse fill="#808080" cx="16" cy="16" rx="7" ry="5"/><ellipse fill="#707070" cx="6" cy="24" rx="5" ry="5"/><ellipse fill="#808080" cx="26" cy="22" rx="5" ry="6"/><ellipse fill="#707070" cx="16" cy="28" rx="4" ry="3"/></svg>`;

// Wall tiles
const stoneWallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#555" width="32" height="32"/><rect fill="#666" x="0" y="0" width="10" height="10" rx="1"/><rect fill="#666" x="11" y="0" width="10" height="10" rx="1"/><rect fill="#666" x="22" y="0" width="10" height="10" rx="1"/><rect fill="#666" x="5" y="11" width="10" height="10" rx="1"/><rect fill="#666" x="16" y="11" width="10" height="10" rx="1"/><rect fill="#666" x="0" y="22" width="10" height="10" rx="1"/><rect fill="#666" x="11" y="22" width="10" height="10" rx="1"/><rect fill="#666" x="22" y="22" width="10" height="10" rx="1"/></svg>`;

const brickWallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" width="32" height="32"/><rect fill="#A0522D" x="0" y="0" width="14" height="7"/><rect fill="#B8634A" x="16" y="0" width="16" height="7"/><rect fill="#B8634A" x="0" y="8" width="8" height="7"/><rect fill="#A0522D" x="10" y="8" width="14" height="7"/><rect fill="#B8634A" x="26" y="8" width="6" height="7"/><rect fill="#A0522D" x="0" y="16" width="14" height="7"/><rect fill="#B8634A" x="16" y="16" width="16" height="7"/><rect fill="#B8634A" x="0" y="24" width="8" height="8"/><rect fill="#A0522D" x="10" y="24" width="14" height="8"/><rect fill="#B8634A" x="26" y="24" width="6" height="8"/></svg>`;

const woodWallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#654321" width="32" height="32"/><rect fill="#8B4513" x="0" y="0" width="7" height="32"/><rect fill="#A0522D" x="8" y="0" width="7" height="32"/><rect fill="#8B4513" x="16" y="0" width="7" height="32"/><rect fill="#A0522D" x="24" y="0" width="8" height="32"/><circle fill="#4a3520" cx="3" cy="8" r="2"/><circle fill="#4a3520" cx="11" cy="18" r="2"/><circle fill="#4a3520" cx="19" cy="6" r="2"/><circle fill="#4a3520" cx="27" cy="24" r="2"/></svg>`;

// Door tiles
const woodDoorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#444" width="32" height="32"/><rect fill="#8B4513" x="4" y="2" width="24" height="28" rx="2"/><rect fill="#A0522D" x="6" y="4" width="9" height="10"/><rect fill="#A0522D" x="17" y="4" width="9" height="10"/><rect fill="#A0522D" x="6" y="16" width="9" height="10"/><rect fill="#A0522D" x="17" y="16" width="9" height="10"/><circle fill="#FFD700" cx="24" cy="16" r="2"/></svg>`;

const ironDoorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#444" width="32" height="32"/><rect fill="#555" x="4" y="2" width="24" height="28" rx="1"/><rect fill="#666" x="6" y="4" width="8" height="12"/><rect fill="#666" x="18" y="4" width="8" height="12"/><rect fill="#666" x="6" y="18" width="8" height="10"/><rect fill="#666" x="18" y="18" width="8" height="10"/><circle fill="#888" cx="24" cy="16" r="2"/><rect fill="#777" x="8" y="6" width="4" height="8"/><rect fill="#777" x="20" y="6" width="4" height="8"/></svg>`;

// Nature tiles
const treeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle fill="#228B22" cx="16" cy="12" r="10"/><circle fill="#2E8B2E" cx="12" cy="8" r="6"/><circle fill="#1E7A1E" cx="20" cy="10" r="5"/><rect fill="#8B4513" x="14" y="20" width="4" height="12"/></svg>`;

const bushSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse fill="#228B22" cx="16" cy="20" rx="14" ry="10"/><circle fill="#2E8B2E" cx="8" cy="18" r="6"/><circle fill="#2E8B2E" cx="24" cy="18" r="6"/><circle fill="#1E7A1E" cx="16" cy="14" r="8"/></svg>`;

const rockSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse fill="#696969" cx="16" cy="20" rx="14" ry="10"/><ellipse fill="#808080" cx="14" cy="16" rx="10" ry="8"/><ellipse fill="#909090" cx="10" cy="14" rx="6" ry="5"/></svg>`;

// Furniture tiles
const tableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" x="2" y="10" width="28" height="4" rx="1"/><rect fill="#A0522D" x="4" y="14" width="4" height="16"/><rect fill="#A0522D" x="24" y="14" width="4" height="16"/></svg>`;

const chairSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" x="6" y="0" width="20" height="4" rx="1"/><rect fill="#A0522D" x="8" y="4" width="4" height="12"/><rect fill="#A0522D" x="20" y="4" width="4" height="12"/><rect fill="#8B4513" x="6" y="16" width="20" height="4" rx="1"/><rect fill="#A0522D" x="8" y="20" width="4" height="12"/><rect fill="#A0522D" x="20" y="20" width="4" height="12"/></svg>`;

const bedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" x="2" y="20" width="28" height="10" rx="2"/><rect fill="#DEB887" x="4" y="8" width="24" height="14" rx="2"/><rect fill="#F5DEB3" x="6" y="10" width="8" height="10" rx="1"/><rect fill="#8B0000" x="14" y="6" width="14" height="16" rx="2"/></svg>`;

const chestSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" x="2" y="8" width="28" height="20" rx="2"/><rect fill="#A0522D" x="4" y="10" width="24" height="8"/><rect fill="#654321" x="2" y="18" width="28" height="2"/><rect fill="#FFD700" x="13" y="14" width="6" height="8" rx="1"/><circle fill="#FFA500" cx="16" cy="18" r="2"/></svg>`;

// Decoration tiles
const torchSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" x="13" y="12" width="6" height="18" rx="1"/><ellipse fill="#FF6600" cx="16" cy="8" rx="6" ry="8"/><ellipse fill="#FFCC00" cx="16" cy="6" rx="3" ry="5"/><ellipse fill="#FFFF00" cx="16" cy="4" rx="1" ry="3"/></svg>`;

const barrelSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse fill="#8B4513" cx="16" cy="28" rx="12" ry="4"/><rect fill="#A0522D" x="4" y="6" width="24" height="22" rx="2"/><ellipse fill="#8B4513" cx="16" cy="6" rx="12" ry="4"/><rect fill="#654321" x="4" y="10" width="24" height="2"/><rect fill="#654321" x="4" y="20" width="24" height="2"/></svg>`;

const potSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse fill="#CD853F" cx="16" cy="26" rx="10" ry="4"/><path fill="#DEB887" d="M6,26 Q6,10 16,10 Q26,10 26,26 Z"/><ellipse fill="#CD853F" cx="16" cy="10" rx="8" ry="3"/></svg>`;

// Dungeon tiles
const skullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse fill="#F5F5DC" cx="16" cy="12" rx="10" ry="10"/><circle fill="#333" cx="11" cy="10" r="3"/><circle fill="#333" cx="21" cy="10" r="3"/><path fill="#333" d="M12,18 L14,20 L16,18 L18,20 L20,18" stroke="#333" stroke-width="1" fill="none"/><rect fill="#F5F5DC" x="10" y="20" width="4" height="10"/><rect fill="#F5F5DC" x="15" y="20" width="4" height="10"/><rect fill="#F5F5DC" x="20" y="20" width="4" height="8"/></svg>`;

const spiderwebSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><line x1="16" y1="0" x2="16" y2="32" stroke="#ddd" stroke-width="1"/><line x1="0" y1="16" x2="32" y2="16" stroke="#ddd" stroke-width="1"/><line x1="0" y1="0" x2="32" y2="32" stroke="#ddd" stroke-width="1"/><line x1="32" y1="0" x2="0" y2="32" stroke="#ddd" stroke-width="1"/><circle cx="16" cy="16" r="4" fill="none" stroke="#ddd" stroke-width="1"/><circle cx="16" cy="16" r="8" fill="none" stroke="#ddd" stroke-width="1"/><circle cx="16" cy="16" r="12" fill="none" stroke="#ddd" stroke-width="1"/></svg>`;

const bonePileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><ellipse fill="#F5F5DC" cx="8" cy="20" rx="6" ry="2"/><ellipse fill="#F5F5DC" cx="24" cy="22" rx="6" ry="2"/><ellipse fill="#FFFFF0" cx="16" cy="18" rx="8" ry="3"/><ellipse fill="#F5F5DC" cx="12" cy="14" rx="4" ry="6" transform="rotate(-30 12 14)"/><ellipse fill="#F5F5DC" cx="22" cy="16" rx="4" ry="5" transform="rotate(20 22 16)"/><circle fill="#FFFFF0" cx="16" cy="8" r="6"/><circle fill="#333" cx="13" cy="7" r="1.5"/><circle fill="#333" cx="19" cy="7" r="1.5"/></svg>`;

const spikeTrapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><polygon fill="#888" points="8,28 6,16 10,16"/><polygon fill="#888" points="16,28 14,12 18,12"/><polygon fill="#888" points="24,28 22,16 26,16"/><polygon fill="#777" points="4,28 2,20 6,20"/><polygon fill="#777" points="12,28 10,18 14,18"/><polygon fill="#777" points="20,28 18,14 22,14"/><polygon fill="#777" points="28,28 26,20 30,20"/><rect fill="#333" x="0" y="28" width="32" height="4"/></svg>`;

const stairsUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><rect fill="#666" x="0" y="24" width="32" height="8"/><rect fill="#777" x="4" y="18" width="24" height="6"/><rect fill="#888" x="8" y="12" width="16" height="6"/><rect fill="#999" x="12" y="6" width="8" height="6"/><polygon fill="#22c55e" points="16,2 12,8 20,8" opacity="0.8"/></svg>`;

const stairsDownSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><rect fill="#333" x="12" y="24" width="8" height="6"/><rect fill="#444" x="8" y="18" width="16" height="6"/><rect fill="#555" x="4" y="12" width="24" height="6"/><rect fill="#666" x="0" y="6" width="32" height="6"/><polygon fill="#ef4444" points="16,30 12,24 20,24" opacity="0.8"/></svg>`;

const pressurePlateSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><rect fill="#666" x="4" y="12" width="24" height="8" rx="1"/><rect fill="#777" x="6" y="14" width="20" height="4"/><rect fill="#555" x="2" y="20" width="28" height="4"/><circle fill="#ef4444" cx="16" cy="16" r="2" opacity="0.6"/></svg>`;

const pitTrapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><rect fill="#111" x="4" y="4" width="24" height="24" rx="2"/><rect fill="#222" x="6" y="6" width="20" height="20"/><rect fill="#1a1a1a" x="8" y="8" width="16" height="16"/><polygon fill="#555" points="4,4 8,8 8,24 4,28"/><polygon fill="#666" points="28,4 24,8 24,24 28,28"/></svg>`;

// Floor variation tiles
const marbleFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#e8e8e8" width="32" height="32"/><path fill="#d0d0d0" d="M0,0 Q8,4 16,2 Q24,0 32,4 L32,8 Q24,4 16,6 Q8,8 0,4 Z" opacity="0.5"/><path fill="#c8c8c8" d="M0,16 Q8,12 16,14 Q24,16 32,12 L32,20 Q24,24 16,22 Q8,20 0,24 Z" opacity="0.4"/><rect fill="#ddd" x="15" y="0" width="2" height="32" opacity="0.3"/><rect fill="#ddd" x="0" y="15" width="32" height="2" opacity="0.3"/></svg>`;

const mossyStoneFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#4a4a4a" width="32" height="32"/><rect fill="#3d3d3d" x="0" y="0" width="15" height="15"/><rect fill="#525252" x="17" y="17" width="15" height="15"/><rect fill="#333" x="15" y="0" width="2" height="32"/><rect fill="#333" x="0" y="15" width="32" height="2"/><circle fill="#2d5a2d" cx="5" cy="5" r="3" opacity="0.6"/><circle fill="#3d6a3d" cx="25" cy="8" r="4" opacity="0.5"/><circle fill="#2d5a2d" cx="10" cy="25" r="3" opacity="0.6"/><circle fill="#3d6a3d" cx="28" cy="28" r="2" opacity="0.5"/></svg>`;

const crackedFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#5a5a5a" width="32" height="32"/><path fill="none" stroke="#333" stroke-width="1" d="M8,0 L12,8 L8,16 L14,24 L10,32"/><path fill="none" stroke="#333" stroke-width="1" d="M20,0 L24,6 L20,12 L26,20 L22,32"/><path fill="none" stroke="#333" stroke-width="1" d="M0,10 L6,12 L12,8 L20,14 L32,10"/><path fill="none" stroke="#333" stroke-width="1" d="M0,22 L8,20 L16,24 L24,20 L32,24"/></svg>`;

const sandFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#d4b896" width="32" height="32"/><circle fill="#c4a886" cx="5" cy="8" r="2"/><circle fill="#e4c8a6" cx="15" cy="5" r="3"/><circle fill="#c4a886" cx="28" cy="12" r="2"/><circle fill="#e4c8a6" cx="8" cy="20" r="2"/><circle fill="#c4a886" cx="22" cy="25" r="3"/><circle fill="#e4c8a6" cx="12" cy="28" r="2"/><circle fill="#b49876" cx="26" cy="6" r="1"/><circle fill="#b49876" cx="4" cy="26" r="1"/></svg>`;

const snowFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#f0f4f8" width="32" height="32"/><circle fill="#fff" cx="6" cy="6" r="4"/><circle fill="#e8ecf0" cx="20" cy="8" r="5"/><circle fill="#fff" cx="10" cy="18" r="3"/><circle fill="#e8ecf0" cx="26" cy="20" r="4"/><circle fill="#fff" cx="16" cy="28" r="3"/><circle fill="#dce0e4" cx="4" cy="28" r="2"/></svg>`;

const rugFloorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#8B4513" width="32" height="32"/><rect fill="#722F37" x="2" y="2" width="28" height="28" rx="1"/><rect fill="#8B2252" x="4" y="4" width="24" height="24"/><rect fill="#722F37" x="6" y="6" width="20" height="20"/><rect fill="#8B2252" x="14" y="8" width="4" height="16"/><rect fill="#8B2252" x="8" y="14" width="16" height="4"/></svg>`;

// Water tiles
const waterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#1E90FF" width="32" height="32"/><path fill="#4169E1" d="M0,8 Q8,4 16,8 Q24,12 32,8 L32,16 Q24,20 16,16 Q8,12 0,16 Z"/><path fill="#00BFFF" d="M0,20 Q8,16 16,20 Q24,24 32,20 L32,28 Q24,32 16,28 Q8,24 0,28 Z"/></svg>`;

const lavaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect fill="#FF4500" width="32" height="32"/><path fill="#FF6600" d="M0,8 Q8,4 16,8 Q24,12 32,8 L32,16 Q24,20 16,16 Q8,12 0,16 Z"/><path fill="#FFCC00" d="M0,20 Q8,16 16,20 Q24,24 32,20 L32,28 Q24,32 16,28 Q8,24 0,28 Z"/><circle fill="#FFFF00" cx="8" cy="12" r="2"/><circle fill="#FFFF00" cx="24" cy="24" r="3"/></svg>`;

// Create all tile definitions
export const EMBEDDED_TILES: TileDefinition[] = [
  // Floors
  { id: 'floor-stone', name: 'Piso de Pedra', category: 'floors', imageData: createSvgDataUrl(stoneFloorSvg), size: 1, rotatable: true },
  { id: 'floor-wood', name: 'Piso de Madeira', category: 'floors', imageData: createSvgDataUrl(woodFloorSvg), size: 1, rotatable: true },
  { id: 'floor-dirt', name: 'Terra', category: 'floors', imageData: createSvgDataUrl(dirtFloorSvg), size: 1, rotatable: true },
  { id: 'floor-grass', name: 'Grama', category: 'floors', imageData: createSvgDataUrl(grassFloorSvg), size: 1, rotatable: true },
  { id: 'floor-cobblestone', name: 'Paralelepípedo', category: 'floors', imageData: createSvgDataUrl(cobblestoneFloorSvg), size: 1, rotatable: true },
  { id: 'floor-marble', name: 'Mármore', category: 'floors', imageData: createSvgDataUrl(marbleFloorSvg), size: 1, rotatable: true },
  { id: 'floor-mossy-stone', name: 'Pedra com Musgo', category: 'floors', imageData: createSvgDataUrl(mossyStoneFloorSvg), size: 1, rotatable: true },
  { id: 'floor-cracked', name: 'Piso Rachado', category: 'floors', imageData: createSvgDataUrl(crackedFloorSvg), size: 1, rotatable: true },
  { id: 'floor-sand', name: 'Areia', category: 'floors', imageData: createSvgDataUrl(sandFloorSvg), size: 1, rotatable: true },
  { id: 'floor-snow', name: 'Neve', category: 'floors', imageData: createSvgDataUrl(snowFloorSvg), size: 1, rotatable: true },
  { id: 'floor-rug', name: 'Tapete', category: 'floors', imageData: createSvgDataUrl(rugFloorSvg), size: 1, rotatable: true },
  
  // Walls
  { id: 'wall-stone', name: 'Parede de Pedra', category: 'walls', imageData: createSvgDataUrl(stoneWallSvg), size: 1, rotatable: false },
  { id: 'wall-brick', name: 'Parede de Tijolos', category: 'walls', imageData: createSvgDataUrl(brickWallSvg), size: 1, rotatable: false },
  { id: 'wall-wood', name: 'Parede de Madeira', category: 'walls', imageData: createSvgDataUrl(woodWallSvg), size: 1, rotatable: false },
  
  // Doors
  { id: 'door-wood', name: 'Porta de Madeira', category: 'doors', imageData: createSvgDataUrl(woodDoorSvg), size: 1, rotatable: true },
  { id: 'door-iron', name: 'Porta de Ferro', category: 'doors', imageData: createSvgDataUrl(ironDoorSvg), size: 1, rotatable: true },
  
  // Nature
  { id: 'nature-tree', name: 'Árvore', category: 'nature', imageData: createSvgDataUrl(treeSvg), size: 1, rotatable: false },
  { id: 'nature-bush', name: 'Arbusto', category: 'nature', imageData: createSvgDataUrl(bushSvg), size: 1, rotatable: false },
  { id: 'nature-rock', name: 'Pedra', category: 'nature', imageData: createSvgDataUrl(rockSvg), size: 1, rotatable: true },
  
  // Furniture
  { id: 'furniture-table', name: 'Mesa', category: 'furniture', imageData: createSvgDataUrl(tableSvg), size: 1, rotatable: true },
  { id: 'furniture-chair', name: 'Cadeira', category: 'furniture', imageData: createSvgDataUrl(chairSvg), size: 1, rotatable: true },
  { id: 'furniture-bed', name: 'Cama', category: 'furniture', imageData: createSvgDataUrl(bedSvg), size: 1, rotatable: true },
  { id: 'furniture-chest', name: 'Baú', category: 'furniture', imageData: createSvgDataUrl(chestSvg), size: 1, rotatable: true },
  
  // Decoration
  { id: 'decoration-torch', name: 'Tocha', category: 'decoration', imageData: createSvgDataUrl(torchSvg), size: 1, rotatable: false },
  { id: 'decoration-barrel', name: 'Barril', category: 'decoration', imageData: createSvgDataUrl(barrelSvg), size: 1, rotatable: false },
  { id: 'decoration-pot', name: 'Vaso', category: 'decoration', imageData: createSvgDataUrl(potSvg), size: 1, rotatable: false },
  
  // Dungeon
  { id: 'dungeon-skull', name: 'Crânio', category: 'dungeon', imageData: createSvgDataUrl(skullSvg), size: 1, rotatable: true },
  { id: 'dungeon-spiderweb', name: 'Teia de Aranha', category: 'dungeon', imageData: createSvgDataUrl(spiderwebSvg), size: 1, rotatable: true },
  { id: 'dungeon-bones', name: 'Ossos', category: 'dungeon', imageData: createSvgDataUrl(bonePileSvg), size: 1, rotatable: true },
  { id: 'dungeon-spike-trap', name: 'Armadilha de Espinhos', category: 'dungeon', imageData: createSvgDataUrl(spikeTrapSvg), size: 1, rotatable: true },
  { id: 'dungeon-stairs-up', name: 'Escada Subindo', category: 'dungeon', imageData: createSvgDataUrl(stairsUpSvg), size: 1, rotatable: true },
  { id: 'dungeon-stairs-down', name: 'Escada Descendo', category: 'dungeon', imageData: createSvgDataUrl(stairsDownSvg), size: 1, rotatable: true },
  { id: 'dungeon-pressure-plate', name: 'Placa de Pressão', category: 'dungeon', imageData: createSvgDataUrl(pressurePlateSvg), size: 1, rotatable: false },
  { id: 'dungeon-pit-trap', name: 'Fosso', category: 'dungeon', imageData: createSvgDataUrl(pitTrapSvg), size: 1, rotatable: false },
  
  // Water
  { id: 'water-water', name: 'Água', category: 'water', imageData: createSvgDataUrl(waterSvg), size: 1, rotatable: false },
  { id: 'water-lava', name: 'Lava', category: 'water', imageData: createSvgDataUrl(lavaSvg), size: 1, rotatable: false },
];

export const getTileById = (id: string): TileDefinition | undefined => {
  return EMBEDDED_TILES.find(t => t.id === id);
};

export const getTilesByCategory = (category: string): TileDefinition[] => {
  return EMBEDDED_TILES.filter(t => t.category === category);
};
