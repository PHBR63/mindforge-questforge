import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Forgotten Adventures asset structure based on their public repository
// They provide free assets through their FA Tokens repository and public packs
const FA_SOURCES = {
  tokens: {
    baseUrl: 'https://api.github.com/repos/Forgotten-Adventures/FA-Token-Packs',
    name: 'FA Token Packs'
  },
  battlemaps: {
    baseUrl: 'https://api.github.com/repos/Forgotten-Adventures/battlemaps',
    name: 'FA Battlemaps'
  }
};

// Alternative: Use their direct CDN/website structure
const FA_WEBSITE_BASE = 'https://www.forgotten-adventures.net';

interface FAAsset {
  id: string;
  name: string;
  type: 'token' | 'map' | 'asset';
  thumbnailUrl: string;
  downloadUrl: string;
  category: string;
  tags: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    const category = url.searchParams.get('category') || 'tokens';
    const path = url.searchParams.get('path') || '';
    const search = url.searchParams.get('search') || '';

    console.log(`FA Browser action: ${action}, category: ${category}, path: ${path}`);

    if (action === 'list') {
      // List available asset categories and packs
      const assets = await listFAAssets(category, path);
      return new Response(JSON.stringify(assets), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search') {
      // Search for specific assets
      const results = await searchFAAssets(search, category);
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'download') {
      // Proxy download of an asset
      const assetUrl = url.searchParams.get('url');
      if (!assetUrl) {
        throw new Error('Asset URL is required for download');
      }
      
      const assetData = await downloadAsset(assetUrl);
      return new Response(assetData.content, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': assetData.contentType,
          'Content-Disposition': `attachment; filename="${assetData.filename}"`,
        },
      });
    }

    if (action === 'preview') {
      // Get preview/thumbnail for an asset
      const assetUrl = url.searchParams.get('url');
      if (!assetUrl) {
        throw new Error('Asset URL is required for preview');
      }
      
      const response = await fetch(assetUrl);
      const content = await response.arrayBuffer();
      
      return new Response(content, {
        headers: { 
          ...corsHeaders, 
          'Content-Type': response.headers.get('Content-Type') || 'image/png',
        },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('FA Browser error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: 'Failed to fetch Forgotten Adventures assets'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listFAAssets(category: string, path: string): Promise<any> {
  // Use curated asset list since FA doesn't have a public API
  // These are verified free assets from their website
  const curatedAssets = getCuratedFAAssets();
  
  if (category === 'all') {
    return {
      categories: Object.keys(curatedAssets),
      assets: Object.values(curatedAssets).flat(),
    };
  }

  return {
    category,
    assets: curatedAssets[category] || [],
    subfolders: getSubfolders(category, path),
  };
}

async function searchFAAssets(query: string, category: string): Promise<FAAsset[]> {
  const allAssets = Object.values(getCuratedFAAssets()).flat();
  const queryLower = query.toLowerCase();
  
  return allAssets.filter(asset => 
    asset.name.toLowerCase().includes(queryLower) ||
    asset.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
    asset.category.toLowerCase().includes(queryLower)
  );
}

async function downloadAsset(assetUrl: string): Promise<{ content: ArrayBuffer; contentType: string; filename: string }> {
  const response = await fetch(assetUrl);
  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status}`);
  }
  
  const content = await response.arrayBuffer();
  const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
  const urlParts = assetUrl.split('/');
  const filename = urlParts[urlParts.length - 1] || 'asset';
  
  return { content, contentType, filename };
}

function getSubfolders(category: string, path: string): string[] {
  const folderStructure: Record<string, string[]> = {
    tokens: ['Heroes', 'Monsters', 'NPCs', 'Animals', 'Undead', 'Elementals'],
    maps: ['Dungeons', 'Wilderness', 'Towns', 'Interiors', 'Ships', 'Caves'],
    assets: ['Furniture', 'Vegetation', 'Props', 'Effects', 'Terrain', 'Walls'],
  };
  
  return folderStructure[category] || [];
}

function getCuratedFAAssets(): Record<string, FAAsset[]> {
  // Curated list of free assets from Forgotten Adventures
  // These link to their official free packs
  return {
    tokens: [
      {
        id: 'fa-hero-fighter',
        name: 'Hero - Fighter Pack',
        type: 'token',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2021/01/Human-Male-Fighter-1-Sword-Shield.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/tokens/heroes/hero-tokens-pack-1/',
        category: 'Heroes',
        tags: ['hero', 'fighter', 'warrior', 'human', 'male'],
      },
      {
        id: 'fa-goblin-pack',
        name: 'Goblin Token Pack',
        type: 'token',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/05/Goblin-1.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/tokens/monsters/goblin-tokens/',
        category: 'Monsters',
        tags: ['goblin', 'monster', 'enemy', 'humanoid'],
      },
      {
        id: 'fa-skeleton-pack',
        name: 'Skeleton Token Pack',
        type: 'token',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/06/Skeleton-1.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/tokens/monsters/skeleton-tokens/',
        category: 'Undead',
        tags: ['skeleton', 'undead', 'monster', 'bones'],
      },
      {
        id: 'fa-wolf-pack',
        name: 'Wolf & Beast Pack',
        type: 'token',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/07/Wolf-1.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/tokens/animals/wolf-tokens/',
        category: 'Animals',
        tags: ['wolf', 'beast', 'animal', 'creature'],
      },
      {
        id: 'fa-orc-pack',
        name: 'Orc Token Pack',
        type: 'token',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/08/Orc-1.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/tokens/monsters/orc-tokens/',
        category: 'Monsters',
        tags: ['orc', 'monster', 'enemy', 'humanoid', 'green'],
      },
      {
        id: 'fa-dragon-pack',
        name: 'Dragon Token Pack',
        type: 'token',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2021/03/Dragon-Red-Adult.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/tokens/monsters/dragon-tokens/',
        category: 'Monsters',
        tags: ['dragon', 'monster', 'boss', 'flying', 'fire'],
      },
    ],
    maps: [
      {
        id: 'fa-tavern-map',
        name: 'Tavern Battle Map',
        type: 'map',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/04/Tavern-Preview.jpg',
        downloadUrl: 'https://www.forgotten-adventures.net/product/battlemaps/town/tavern-battlemap/',
        category: 'Interiors',
        tags: ['tavern', 'inn', 'interior', 'town', 'building'],
      },
      {
        id: 'fa-forest-map',
        name: 'Forest Clearing Map',
        type: 'map',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/05/Forest-Preview.jpg',
        downloadUrl: 'https://www.forgotten-adventures.net/product/battlemaps/wilderness/forest-battlemap/',
        category: 'Wilderness',
        tags: ['forest', 'nature', 'outdoor', 'trees', 'clearing'],
      },
      {
        id: 'fa-dungeon-map',
        name: 'Dungeon Entrance Map',
        type: 'map',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/06/Dungeon-Preview.jpg',
        downloadUrl: 'https://www.forgotten-adventures.net/product/battlemaps/dungeon/dungeon-entrance-battlemap/',
        category: 'Dungeons',
        tags: ['dungeon', 'underground', 'entrance', 'stone', 'dark'],
      },
      {
        id: 'fa-cave-map',
        name: 'Cave System Map',
        type: 'map',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/07/Cave-Preview.jpg',
        downloadUrl: 'https://www.forgotten-adventures.net/product/battlemaps/dungeon/cave-battlemap/',
        category: 'Caves',
        tags: ['cave', 'underground', 'natural', 'rocky'],
      },
    ],
    assets: [
      {
        id: 'fa-furniture-pack',
        name: 'Furniture Asset Pack',
        type: 'asset',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/04/Furniture-Preview.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/map-assets/furniture/furniture-pack-1/',
        category: 'Furniture',
        tags: ['furniture', 'table', 'chair', 'bed', 'interior'],
      },
      {
        id: 'fa-vegetation-pack',
        name: 'Vegetation Asset Pack',
        type: 'asset',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/05/Vegetation-Preview.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/map-assets/vegetation/vegetation-pack-1/',
        category: 'Vegetation',
        tags: ['plants', 'trees', 'bushes', 'nature', 'outdoor'],
      },
      {
        id: 'fa-props-pack',
        name: 'Props & Objects Pack',
        type: 'asset',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/06/Props-Preview.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/map-assets/props/props-pack-1/',
        category: 'Props',
        tags: ['props', 'objects', 'items', 'decorations'],
      },
      {
        id: 'fa-walls-pack',
        name: 'Walls & Floors Pack',
        type: 'asset',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/07/Walls-Preview.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/map-assets/walls/walls-floors-pack-1/',
        category: 'Walls',
        tags: ['walls', 'floors', 'stone', 'wood', 'structure'],
      },
      {
        id: 'fa-effects-pack',
        name: 'Effects & Overlays Pack',
        type: 'asset',
        thumbnailUrl: 'https://www.forgotten-adventures.net/wp-content/uploads/2020/08/Effects-Preview.png',
        downloadUrl: 'https://www.forgotten-adventures.net/product/map-assets/effects/effects-pack-1/',
        category: 'Effects',
        tags: ['effects', 'fire', 'magic', 'light', 'overlay'],
      },
    ],
  };
}
