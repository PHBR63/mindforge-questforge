import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Search,
  ExternalLink,
  Download,
  Star,
  Grid3X3,
  User,
  Package,
  Mountain,
  Sparkles,
  Layout,
  Info,
} from 'lucide-react';
import {
  CURATED_ASSET_PACKS,
  ASSET_SOURCES,
  ASSET_CATEGORIES,
  LICENSE_COLORS,
  filterAssetPacks,
  type OnlineAssetPack,
} from './assetSources';

interface OnlineAssetBrowserProps {
  onAssetPackSelect?: (pack: OnlineAssetPack) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'tileset':
      return <Grid3X3 className="w-4 h-4" />;
    case 'tokens':
      return <User className="w-4 h-4" />;
    case 'objects':
      return <Package className="w-4 h-4" />;
    case 'terrain':
      return <Mountain className="w-4 h-4" />;
    case 'effects':
      return <Sparkles className="w-4 h-4" />;
    case 'ui':
      return <Layout className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

export function OnlineAssetBrowser({ onAssetPackSelect }: OnlineAssetBrowserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'featured' | 'all' | 'sources'>('featured');

  const filteredPacks = useMemo(() => {
    return filterAssetPacks(CURATED_ASSET_PACKS, {
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      license: selectedLicense === 'all' ? undefined : selectedLicense,
      search: searchQuery || undefined,
      featured: viewMode === 'featured' ? true : undefined,
    });
  }, [searchQuery, selectedCategory, selectedLicense, viewMode]);

  const handleOpenSource = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          Assets Online
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Biblioteca de Assets Online
          </DialogTitle>
          <DialogDescription>
            Assets gratuitos e CC0 de fontes confiáveis para seus mapas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="w-full">
              <TabsTrigger value="featured" className="flex-1 gap-2">
                <Star className="w-4 h-4" />
                Destaques
              </TabsTrigger>
              <TabsTrigger value="all" className="flex-1 gap-2">
                <Grid3X3 className="w-4 h-4" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="sources" className="flex-1 gap-2">
                <ExternalLink className="w-4 h-4" />
                Fontes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters (only for featured/all) */}
          {viewMode !== 'sources' && (
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(ASSET_CATEGORIES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Licença" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CC0">CC0</SelectItem>
                  <SelectItem value="CC-BY">CC-BY</SelectItem>
                  <SelectItem value="Free">Grátis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {viewMode === 'sources' ? (
              // Sources View
              <div className="grid gap-4">
                {ASSET_SOURCES.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenSource(source.url)}
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{source.name}</h4>
                      <p className="text-sm text-muted-foreground">{source.description}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
                
                <div className="p-4 rounded-lg border border-dashed bg-muted/20">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Como usar:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Clique em uma fonte para abrir o site</li>
                        <li>Baixe os assets desejados (ZIP)</li>
                        <li>Extraia as imagens do arquivo</li>
                        <li>Use o botão "Upload" na biblioteca para importar</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Asset Packs Grid
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPacks.map((pack) => (
                  <div
                    key={pack.id}
                    className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img
                        src={pack.thumbnailUrl}
                        alt={pack.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      {pack.featured && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <Star className="w-3 h-3" />
                            Destaque
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm line-clamp-1">{pack.name}</h4>
                          <p className="text-xs text-muted-foreground">{pack.author}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${LICENSE_COLORS[pack.license]}`}
                        >
                          {pack.license}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pack.description}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs gap-1">
                          {getCategoryIcon(pack.category)}
                          {ASSET_CATEGORIES[pack.category as keyof typeof ASSET_CATEGORIES]?.label}
                        </Badge>
                        {pack.assetCount && (
                          <span className="text-xs text-muted-foreground">
                            {pack.assetCount}+ assets
                          </span>
                        )}
                        {pack.resolution && (
                          <span className="text-xs text-muted-foreground">
                            {pack.resolution}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleOpenSource(pack.sourceUrl)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Ver Fonte
                        </Button>
                        {pack.downloadUrl && (
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleOpenSource(pack.downloadUrl!)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Baixar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredPacks.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum asset encontrado</p>
                    <p className="text-sm">Tente ajustar os filtros</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
