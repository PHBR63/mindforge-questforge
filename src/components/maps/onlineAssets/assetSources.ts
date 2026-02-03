/**
 * Online Asset Sources - Curated library of free CC0/open licensed assets
 * These are trusted sources that can be integrated into the map builder
 */

export interface OnlineAssetPack {
  id: string;
  name: string;
  author: string;
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
  downloadUrl?: string;
  license: 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'Free' | 'Custom';
  category: 'tileset' | 'tokens' | 'objects' | 'terrain' | 'effects' | 'ui';
  tags: string[];
  assetCount?: number;
  resolution?: string;
  featured?: boolean;
}

export interface AssetSource {
  id: string;
  name: string;
  url: string;
  description: string;
  logoUrl?: string;
}

// Trusted asset sources
export const ASSET_SOURCES: AssetSource[] = [
  {
    id: 'kenney',
    name: 'Kenney.nl',
    url: 'https://kenney.nl/assets',
    description: 'Milhares de assets CC0 de alta qualidade para jogos',
    logoUrl: 'https://kenney.nl/content/kenney-logo.png',
  },
  {
    id: 'opengameart',
    name: 'OpenGameArt.org',
    url: 'https://opengameart.org/',
    description: 'Comunidade de assets gratuitos com várias licenças',
  },
  {
    id: 'itch',
    name: 'Itch.io',
    url: 'https://itch.io/game-assets/free/tag-tileset',
    description: 'Maior marketplace de assets indie, muitos gratuitos',
  },
  {
    id: 'forgotten-adventures',
    name: 'Forgotten Adventures',
    url: 'https://www.forgotten-adventures.net/',
    description: 'Assets profissionais para mapas de RPG, 100k+ grátis',
  },
];

// Curated list of popular free asset packs
export const CURATED_ASSET_PACKS: OnlineAssetPack[] = [
  // Kenney Assets
  {
    id: 'kenney-tiny-dungeon',
    name: 'Tiny Dungeon',
    author: 'Kenney',
    description: 'Pack completo de dungeon em pixel art 16x16. Inclui tiles, personagens, itens e UI.',
    thumbnailUrl: 'https://kenney.nl/media/pages/assets/tiny-dungeon/1355838882-1710851451/sample-512x.png',
    sourceUrl: 'https://kenney.nl/assets/tiny-dungeon',
    downloadUrl: 'https://kenney.nl/assets/tiny-dungeon',
    license: 'CC0',
    category: 'tileset',
    tags: ['dungeon', 'pixel-art', '16x16', 'fantasy', 'rpg'],
    assetCount: 130,
    resolution: '16x16',
    featured: true,
  },
  {
    id: 'kenney-tiny-town',
    name: 'Tiny Town',
    author: 'Kenney',
    description: 'Tiles de cidade medieval com casas, lojas, estradas e decorações.',
    thumbnailUrl: 'https://kenney.nl/media/pages/assets/tiny-town/e3dcc0ff09-1710851451/sample-512x.png',
    sourceUrl: 'https://kenney.nl/assets/tiny-town',
    downloadUrl: 'https://kenney.nl/assets/tiny-town',
    license: 'CC0',
    category: 'tileset',
    tags: ['town', 'medieval', 'pixel-art', '16x16', 'buildings'],
    assetCount: 100,
    resolution: '16x16',
    featured: true,
  },
  {
    id: 'kenney-roguelike-rpg',
    name: 'Roguelike/RPG Pack',
    author: 'Kenney',
    description: 'Pack massivo com 1700+ sprites para RPG. Personagens, monstros, itens e tiles.',
    thumbnailUrl: 'https://kenney.nl/media/pages/assets/roguelike-rpg-pack/6c80bfebf4-1710851451/sample-512x.png',
    sourceUrl: 'https://kenney.nl/assets/roguelike-rpg-pack',
    downloadUrl: 'https://kenney.nl/assets/roguelike-rpg-pack',
    license: 'CC0',
    category: 'tileset',
    tags: ['roguelike', 'rpg', 'monsters', 'items', 'characters'],
    assetCount: 1700,
    resolution: '16x16',
    featured: true,
  },
  {
    id: 'kenney-medieval-rts',
    name: 'Medieval RTS',
    author: 'Kenney',
    description: 'Assets isométricos medievais para estratégia. Castelos, unidades e terreno.',
    thumbnailUrl: 'https://kenney.nl/media/pages/assets/medieval-rts/8e8b3dc7a9-1710851451/sample-512x.png',
    sourceUrl: 'https://kenney.nl/assets/medieval-rts',
    downloadUrl: 'https://kenney.nl/assets/medieval-rts',
    license: 'CC0',
    category: 'tileset',
    tags: ['isometric', 'medieval', 'rts', 'castle', 'strategy'],
    assetCount: 140,
    resolution: 'Isometric',
  },
  // 0x72 / Pixel-boy Assets
  {
    id: '0x72-dungeon-tileset-ii',
    name: '16x16 DungeonTileset II',
    author: '0x72 (Robert)',
    description: 'Tileset de dungeon extremamente popular. Paredes, pisos, portas, decorações e personagens.',
    thumbnailUrl: 'https://img.itch.zone/aW1hZ2UvMjU2OTUxLzEyMzA4NTcucG5n/315x250%23c/eBDnxe.png',
    sourceUrl: 'https://0x72.itch.io/dungeontileset-ii',
    license: 'CC0',
    category: 'tileset',
    tags: ['dungeon', 'pixel-art', '16x16', 'fantasy', 'roguelike'],
    assetCount: 180,
    resolution: '16x16',
    featured: true,
  },
  {
    id: '0x72-16x16-industrial',
    name: '16x16 Industrial Tileset',
    author: '0x72 (Robert)',
    description: 'Tileset industrial/steampunk com fábricas, máquinas e ambientes urbanos.',
    thumbnailUrl: 'https://img.itch.zone/aW1hZ2UvMTY4NDgxLzc4NDg2MS5wbmc=/315x250%23c/Lrq%2BZH.png',
    sourceUrl: 'https://0x72.itch.io/16x16-industrial-tileset',
    license: 'CC0',
    category: 'tileset',
    tags: ['industrial', 'steampunk', 'urban', '16x16'],
    assetCount: 100,
    resolution: '16x16',
  },
  // LimeZu Assets
  {
    id: 'limezu-modern-interiors',
    name: 'Modern Interiors',
    author: 'LimeZu',
    description: 'Pack de interiores modernos detalhados. Quartos, cozinhas, escritórios e mais.',
    thumbnailUrl: 'https://img.itch.zone/aW1hZ2UvMTA2MzEyMC82MTY4MTQyLnBuZw==/315x250%23c/V%2BMXHU.png',
    sourceUrl: 'https://limezu.itch.io/moderninteriors',
    license: 'Free',
    category: 'tileset',
    tags: ['modern', 'interior', 'furniture', '16x16'],
    assetCount: 2900,
    resolution: '16x16',
    featured: true,
  },
  {
    id: 'limezu-modern-exteriors',
    name: 'Modern Exteriors',
    author: 'LimeZu',
    description: 'Complemento do Modern Interiors com exteriores urbanos modernos.',
    thumbnailUrl: 'https://img.itch.zone/aW1hZ2UvMTQ2OTA5NS84NTU5MzEzLnBuZw==/315x250%23c/X06XxT.png',
    sourceUrl: 'https://limezu.itch.io/modernexteriors',
    license: 'Free',
    category: 'tileset',
    tags: ['modern', 'exterior', 'city', 'urban', '16x16'],
    assetCount: 500,
    resolution: '16x16',
  },
  // Cainos Assets
  {
    id: 'cainos-pixel-art-top-down',
    name: 'Pixel Art Top Down - Basic',
    author: 'Cainos',
    description: 'Tileset top-down básico e versátil. Grama, água, caminhos e árvores.',
    thumbnailUrl: 'https://img.itch.zone/aW1hZ2UvMzM4NzE4LzE2Nzc1MzUucG5n/315x250%23c/xzwl5v.png',
    sourceUrl: 'https://cainos.itch.io/pixel-art-top-down-basic',
    license: 'Free',
    category: 'terrain',
    tags: ['top-down', 'nature', 'basic', 'grass', 'water'],
    assetCount: 80,
    resolution: '32x32',
  },
  // Tokens
  {
    id: 'kenney-animal-pack-redux',
    name: 'Animal Pack Redux',
    author: 'Kenney',
    description: 'Animais em estilo cartoon. Perfeito para tokens de criaturas.',
    thumbnailUrl: 'https://kenney.nl/media/pages/assets/animal-pack-redux/4dcab63f9d-1710851451/sample-512x.png',
    sourceUrl: 'https://kenney.nl/assets/animal-pack-redux',
    license: 'CC0',
    category: 'tokens',
    tags: ['animals', 'creatures', 'cartoon', 'tokens'],
    assetCount: 60,
  },
  {
    id: 'kenney-fantasy-icons',
    name: 'Game Icons',
    author: 'Kenney',
    description: 'Ícones vetoriais para RPG. Armas, armaduras, poções, magias e mais.',
    thumbnailUrl: 'https://kenney.nl/media/pages/assets/game-icons/3e1e56f2e5-1710851451/sample-512x.png',
    sourceUrl: 'https://kenney.nl/assets/game-icons',
    license: 'CC0',
    category: 'objects',
    tags: ['icons', 'items', 'weapons', 'rpg', 'ui'],
    assetCount: 700,
  },
  // Effects
  {
    id: 'pimen-fire-fx',
    name: 'Fire FX',
    author: 'Pimen',
    description: 'Efeitos de fogo animados em pixel art para RPGs e jogos de ação.',
    thumbnailUrl: 'https://img.itch.zone/aW1hZ2UvNjM2MDU1LzM0MTk0MjAucG5n/315x250%23c/7xjEhY.png',
    sourceUrl: 'https://pimen.itch.io/fire-spell-effect-01',
    license: 'Free',
    category: 'effects',
    tags: ['fire', 'spell', 'effects', 'animated'],
    assetCount: 10,
    resolution: '32x32',
  },
  // VTT-Ready Maps
  {
    id: 'mikeschley-battlemaps',
    name: 'Free Battle Maps',
    author: 'Mike Schley',
    description: 'Mapas de batalha profissionais gratuitos em alta resolução.',
    thumbnailUrl: 'https://mikeschley.com/wp-content/uploads/2017/08/MikeSchley_LMoP-CragmawHideout-DM-232x300.jpg',
    sourceUrl: 'https://mikeschley.com/free-maps/',
    license: 'Free',
    category: 'terrain',
    tags: ['battlemap', 'dungeon', 'professional', 'high-res'],
    featured: true,
  },
];

// Category labels
export const ASSET_CATEGORIES = {
  tileset: { label: 'Tilesets', icon: 'Grid3X3' },
  tokens: { label: 'Tokens', icon: 'User' },
  objects: { label: 'Objetos', icon: 'Package' },
  terrain: { label: 'Terreno', icon: 'Mountain' },
  effects: { label: 'Efeitos', icon: 'Sparkles' },
  ui: { label: 'Interface', icon: 'Layout' },
} as const;

// License colors
export const LICENSE_COLORS = {
  'CC0': 'bg-green-500/20 text-green-400 border-green-500/30',
  'CC-BY': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'CC-BY-SA': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Free': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Custom': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
} as const;

// Filter packs
export function filterAssetPacks(
  packs: OnlineAssetPack[],
  options: {
    category?: string;
    license?: string;
    search?: string;
    featured?: boolean;
  }
): OnlineAssetPack[] {
  return packs.filter((pack) => {
    if (options.category && pack.category !== options.category) return false;
    if (options.license && pack.license !== options.license) return false;
    if (options.featured && !pack.featured) return false;
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const matchesName = pack.name.toLowerCase().includes(searchLower);
      const matchesAuthor = pack.author.toLowerCase().includes(searchLower);
      const matchesTags = pack.tags.some((tag) => tag.includes(searchLower));
      const matchesDesc = pack.description.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesAuthor && !matchesTags && !matchesDesc) return false;
    }
    return true;
  });
}
