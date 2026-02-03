export interface MapAsset {
  id: string;
  map_id: string;
  user_id: string;
  asset_type: string;
  asset_key: string;
  name: string | null;
  position_x: number;
  position_y: number;
  rotation: number | null;
  scale: number | null;
  layer: number | null;
  is_visible: boolean | null;
  custom_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetDefinition {
  key: string;
  name: string;
  icon: string;
  category: string;
  color?: string;
  size?: number;
}

export const ASSET_CATEGORIES = [
  { id: 'furniture', name: 'Mobília', icon: '🪑' },
  { id: 'nature', name: 'Natureza', icon: '🌲' },
  { id: 'dungeon', name: 'Masmorra', icon: '🏰' },
  { id: 'markers', name: 'Marcadores', icon: '📍' },
  { id: 'effects', name: 'Efeitos', icon: '✨' },
  { id: 'containers', name: 'Containers', icon: '📦' },
] as const;

export const PREDEFINED_ASSETS: AssetDefinition[] = [
  // Furniture
  { key: 'table', name: 'Mesa', icon: '🪑', category: 'furniture', size: 2 },
  { key: 'chair', name: 'Cadeira', icon: '🪑', category: 'furniture' },
  { key: 'bed', name: 'Cama', icon: '🛏️', category: 'furniture', size: 2 },
  { key: 'bookshelf', name: 'Estante', icon: '📚', category: 'furniture' },
  { key: 'fireplace', name: 'Lareira', icon: '🔥', category: 'furniture' },
  { key: 'throne', name: 'Trono', icon: '🪑', category: 'furniture' },
  { key: 'candle', name: 'Vela', icon: '🕯️', category: 'furniture' },
  { key: 'lamp', name: 'Lampião', icon: '🏮', category: 'furniture' },
  
  // Nature
  { key: 'tree', name: 'Árvore', icon: '🌲', category: 'nature', size: 2 },
  { key: 'bush', name: 'Arbusto', icon: '🌿', category: 'nature' },
  { key: 'rock', name: 'Pedra', icon: '🪨', category: 'nature' },
  { key: 'water', name: 'Água', icon: '💧', category: 'nature' },
  { key: 'flower', name: 'Flor', icon: '🌸', category: 'nature' },
  { key: 'mushroom', name: 'Cogumelo', icon: '🍄', category: 'nature' },
  { key: 'campfire', name: 'Fogueira', icon: '🔥', category: 'nature' },
  { key: 'tent', name: 'Tenda', icon: '⛺', category: 'nature', size: 2 },
  
  // Dungeon
  { key: 'door', name: 'Porta', icon: '🚪', category: 'dungeon' },
  { key: 'stairs_up', name: 'Escada ↑', icon: '⬆️', category: 'dungeon' },
  { key: 'stairs_down', name: 'Escada ↓', icon: '⬇️', category: 'dungeon' },
  { key: 'pillar', name: 'Pilar', icon: '🏛️', category: 'dungeon' },
  { key: 'statue', name: 'Estátua', icon: '🗿', category: 'dungeon' },
  { key: 'altar', name: 'Altar', icon: '⛪', category: 'dungeon' },
  { key: 'torch', name: 'Tocha', icon: '🔦', category: 'dungeon' },
  { key: 'cobweb', name: 'Teia', icon: '🕸️', category: 'dungeon' },
  
  // Markers
  { key: 'treasure', name: 'Tesouro', icon: '💰', category: 'markers', color: '#fbbf24' },
  { key: 'trap', name: 'Armadilha', icon: '⚠️', category: 'markers', color: '#ef4444' },
  { key: 'secret', name: 'Segredo', icon: '🔮', category: 'markers', color: '#8b5cf6' },
  { key: 'quest', name: 'Missão', icon: '❗', category: 'markers', color: '#f59e0b' },
  { key: 'danger', name: 'Perigo', icon: '☠️', category: 'markers', color: '#dc2626' },
  { key: 'safe', name: 'Seguro', icon: '✅', category: 'markers', color: '#22c55e' },
  { key: 'lock', name: 'Trancado', icon: '🔒', category: 'markers' },
  { key: 'key', name: 'Chave', icon: '🔑', category: 'markers' },
  
  // Effects
  { key: 'fire_effect', name: 'Fogo', icon: '🔥', category: 'effects' },
  { key: 'ice_effect', name: 'Gelo', icon: '❄️', category: 'effects' },
  { key: 'magic_effect', name: 'Magia', icon: '✨', category: 'effects' },
  { key: 'poison_effect', name: 'Veneno', icon: '☠️', category: 'effects' },
  { key: 'light_effect', name: 'Luz', icon: '💡', category: 'effects' },
  { key: 'dark_effect', name: 'Escuridão', icon: '🌑', category: 'effects' },
  { key: 'wind_effect', name: 'Vento', icon: '💨', category: 'effects' },
  { key: 'lightning_effect', name: 'Raio', icon: '⚡', category: 'effects' },
  
  // Containers
  { key: 'chest', name: 'Baú', icon: '📦', category: 'containers' },
  { key: 'barrel', name: 'Barril', icon: '🛢️', category: 'containers' },
  { key: 'crate', name: 'Caixa', icon: '📦', category: 'containers' },
  { key: 'bag', name: 'Saco', icon: '👝', category: 'containers' },
  { key: 'pot', name: 'Pote', icon: '🏺', category: 'containers' },
  { key: 'cauldron', name: 'Caldeirão', icon: '🍲', category: 'containers' },
  { key: 'urn', name: 'Urna', icon: '⚱️', category: 'containers' },
  { key: 'coffin', name: 'Caixão', icon: '⚰️', category: 'containers', size: 2 },
];

export const getAssetByKey = (key: string): AssetDefinition | undefined => {
  return PREDEFINED_ASSETS.find(a => a.key === key);
};
