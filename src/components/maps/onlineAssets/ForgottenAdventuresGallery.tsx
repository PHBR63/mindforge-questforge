import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
  onAssetSelect?: (asset: FAAsset) => void;
}

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
  const [activeTab, setActiveTab] = useState<'tokens' | 'maps' | 'assets'>('tokens');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<FAAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = async (category: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('forgotten-adventures-browser', {
        body: null,
        headers: {},
      });

      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forgotten-adventures-browser?action=list&category=${category}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

  const searchAssets = async (query: string) => {
    if (!query.trim()) {
      fetchAssets(activeTab);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forgotten-adventures-browser?action=search&search=${encodeURIComponent(query)}&category=${activeTab}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const results = await response.json();
      setAssets(results || []);
    } catch (err) {
      console.error('Error searching FA assets:', err);
      setError('Erro na busca. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets(activeTab);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (isOpen) {
        searchAssets(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleOpenSource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (asset: FAAsset) => {
    toast({
      title: 'Redirecionando...',
      description: `Abrindo página de download para ${asset.name}`,
    });
    handleOpenSource(asset.downloadUrl);
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
            Assets profissionais gratuitos para seus mapas de RPG - 100.000+ assets disponíveis
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
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar assets (ex: dragon, tavern, furniture)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {loading ? (
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
                <p className="text-sm">Tente ajustar sua busca</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredAssets.map((asset) => (
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
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getTypeColor(asset.type)}`}
                        >
                          {getCategoryIcon(asset.type)}
                          <span className="ml-1 capitalize">{asset.type}</span>
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
                        {asset.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{asset.tags.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleOpenSource(asset.downloadUrl)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver Página
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleDownload(asset)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Os assets são baixados diretamente do site Forgotten Adventures.{' '}
              <button
                className="text-primary hover:underline"
                onClick={() => handleOpenSource('https://www.forgotten-adventures.net/')}
              >
                Visite o site oficial
              </button>{' '}
              para mais de 100.000 assets profissionais.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
