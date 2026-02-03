import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  ExternalLink,
  Download,
  User,
  Map,
  Package,
  Loader2,
  AlertCircle,
  Sparkles,
  Check,
  HardDrive,
  Trash2,
  Image,
} from 'lucide-react';
import { useAssetCache } from '@/hooks/useAssetCache';
import { toast } from '@/components/ui/use-toast';

interface FAAsset {
  id: string;
  name: string;
  type: 'token' | 'map' | 'asset';
  thumbnailUrl: string;
  downloadUrl: string;
  category: string;
  tags: string[];
}

interface ForgottenAdventuresGalleryProps {
  onAssetSelect?: (asset: FAAsset, cachedUrl: string) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'token':
      return <User className="w-4 h-4" />;
    case 'map':
      return <Map className="w-4 h-4" />;
    case 'asset':
      return <Package className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'token':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'map':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'asset':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

export function ForgottenAdventuresGallery({ onAssetSelect }: ForgottenAdventuresGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tokens' | 'maps' | 'assets' | 'cached'>('tokens');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<FAAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const {
    cachedAssets,
    cacheSize,
    formattedCacheSize,
    formattedMaxCacheSize,
    maxCacheSize,
    isAssetCached,
    getCachedAsset,
    cacheAsset,
    removeFromCache,
    clearCache,
  } = useAssetCache();

  const fetchAssets = async (category: string) => {
    if (category === 'cached') {
      setAssets([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/forgotten-adventures-browser?action=list&category=${category}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }

      const result = await response.json();
      setAssets(result.assets || []);
    } catch (err) {
      console.error('Error fetching FA assets:', err);
      setError('Não foi possível carregar os assets. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab !== 'cached') {
      fetchAssets(activeTab);
    }
  }, [isOpen, activeTab]);

  const handleOpenSource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDirectDownload = async (asset: FAAsset) => {
    // Check if already cached
    if (isAssetCached(asset.id)) {
      const cached = await getCachedAsset(asset.id);
      if (cached) {
        toast({
          title: 'Asset já em cache!',
          description: `${asset.name} já está salvo localmente.`,
        });
        if (onAssetSelect) {
          onAssetSelect(asset, cached.url);
        }
        return;
      }
    }

    setDownloadingId(asset.id);
    setDownloadProgress(0);

    try {
      // Use the proxy to download the thumbnail image directly
      const proxyUrl = `${SUPABASE_URL}/functions/v1/forgotten-adventures-browser?action=proxy-image&url=${encodeURIComponent(asset.thumbnailUrl)}`;

      setDownloadProgress(20);

      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      setDownloadProgress(60);

      const blob = await response.blob();
      setDownloadProgress(80);

      // Cache the asset
      const cachedUrl = await cacheAsset(
        asset.id,
        asset.name,
        blob,
        asset.thumbnailUrl,
        asset.category,
        'forgotten-adventures'
      );

      setDownloadProgress(100);

      toast({
        title: 'Asset baixado!',
        description: `${asset.name} foi salvo no cache local.`,
      });

      if (onAssetSelect) {
        onAssetSelect(asset, cachedUrl);
      }
    } catch (err) {
      console.error('Error downloading asset:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao baixar',
        description: 'Não foi possível baixar o asset. Tente novamente.',
      });
    } finally {
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleUseCached = async (assetMeta: typeof cachedAssets[0]) => {
    const cached = await getCachedAsset(assetMeta.id);
    if (cached && onAssetSelect) {
      const fakeAsset: FAAsset = {
        id: assetMeta.id,
        name: assetMeta.name,
        type: 'asset',
        thumbnailUrl: assetMeta.thumbnailUrl,
        downloadUrl: '',
        category: assetMeta.category,
        tags: [],
      };
      onAssetSelect(fakeAsset, cached.url);
      toast({
        title: 'Asset selecionado',
        description: `${assetMeta.name} foi selecionado do cache.`,
      });
    }
  };

  const handleClearCache = async () => {
    await clearCache();
    toast({
      title: 'Cache limpo',
      description: 'Todos os assets em cache foram removidos.',
    });
  };

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.category.toLowerCase().includes(query) ||
      asset.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  const filteredCachedAssets = cachedAssets.filter(asset => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.category.toLowerCase().includes(query)
    );
  });

  const cachePercentage = Math.round((cacheSize / maxCacheSize) * 100);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Forgotten Adventures
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Forgotten Adventures
          </DialogTitle>
          <DialogDescription>
            Assets profissionais gratuitos - Clique em "Baixar" para salvar localmente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Category Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="tokens" className="flex-1 gap-2">
                <User className="w-4 h-4" />
                Tokens
              </TabsTrigger>
              <TabsTrigger value="maps" className="flex-1 gap-2">
                <Map className="w-4 h-4" />
                Mapas
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex-1 gap-2">
                <Package className="w-4 h-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="cached" className="flex-1 gap-2">
                <HardDrive className="w-4 h-4" />
                Cache ({cachedAssets.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Cache Info Bar */}
          {activeTab === 'cached' && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Armazenamento Local</span>
                  <span className="text-xs text-muted-foreground">
                    {formattedCacheSize} / {formattedMaxCacheSize}
                  </span>
                </div>
                <Progress value={cachePercentage} className="h-2" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={cachedAssets.length === 0}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar
              </Button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {activeTab === 'cached' ? (
              // Cached Assets Grid
              filteredCachedAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <HardDrive className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhum asset em cache</p>
                  <p className="text-sm">Baixe assets das outras abas para usar offline</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
                  {filteredCachedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => handleUseCached(asset)}
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Image className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.category}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCache(asset.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => fetchAssets(activeTab)}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mb-4 opacity-50" />
                <p>Nenhum asset encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredAssets.map((asset) => {
                  const isCached = isAssetCached(asset.id);
                  const isDownloading = downloadingId === asset.id;

                  return (
                    <div
                      key={asset.id}
                      className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-all"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          {isCached && (
                            <Badge className="bg-green-500/90 text-white border-0 gap-1">
                              <Check className="w-3 h-3" />
                              Salvo
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTypeColor(asset.type)}`}
                          >
                            {getCategoryIcon(asset.type)}
                          </Badge>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-2">
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">{asset.name}</h4>
                          <p className="text-xs text-muted-foreground">{asset.category}</p>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Download Progress */}
                        {isDownloading && (
                          <Progress value={downloadProgress} className="h-1" />
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleOpenSource(asset.downloadUrl)}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Ver Pack
                          </Button>
                          <Button
                            variant={isCached ? 'secondary' : 'default'}
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleDirectDownload(asset)}
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : isCached ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Download className="w-3 h-3 mr-1" />
                            )}
                            {isCached ? 'Baixado' : 'Baixar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Assets baixados são salvos localmente (até {formattedMaxCacheSize}).{' '}
              <button
                className="text-primary hover:underline"
                onClick={() => handleOpenSource('https://www.forgotten-adventures.net/')}
              >
                Visite o site oficial
              </button>{' '}
              para packs completos.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
