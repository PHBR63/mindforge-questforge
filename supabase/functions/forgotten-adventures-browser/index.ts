import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface FAAsset {
  id: string;
  name: string;
  type: 'token' | 'map' | 'asset';
  thumbnailUrl: string;
  downloadUrl: string;
  // Direct image URLs for individual assets
  directImageUrls?: string[];
  category: string;
  tags: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';
    const category = url.searchParams.get('category') || 'tokens';
    const search = url.searchParams.get('search') || '';

    console.log(`FA Browser action: ${action}, category: ${category}`);

    if (action === 'list') {
      const assets = await listFAAssets(category);
      return new Response(JSON.stringify(assets), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'search') {
      const results = await searchFAAssets(search, category);
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'proxy-image') {
      // Proxy image download to bypass CORS
      const imageUrl = url.searchParams.get('url');
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      console.log(`Proxying image: ${imageUrl}`);

      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*',
          'Referer': 'https://www.forgotten-adventures.net/',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type') || 'image/png';
      const arrayBuffer = await response.arrayBuffer();

      return new Response(arrayBuffer, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (action === 'download') {
      const assetUrl = url.searchParams.get('url');
      if (!assetUrl) {
        throw new Error('Asset URL is required for download');
      }

      console.log(`Downloading asset: ${assetUrl}`);

      const response = await fetch(assetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.forgotten-adventures.net/',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }

      const content = await response.arrayBuffer();
      const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
      const urlParts = assetUrl.split('/');
      const filename = urlParts[urlParts.length - 1] || 'asset';

      return new Response(content, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
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
      details: 'Failed to process Forgotten Adventures request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function listFAAssets(category: string): Promise<{ category: string; assets: FAAsset[] }> {
  const curatedAssets = getCuratedFAAssets();

  if (category === 'all') {
    return {
      category: 'all',
      assets: Object.values(curatedAssets).flat(),
    };
  }

  return {
    category,
    assets: curatedAssets[category] || [],
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
