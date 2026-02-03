import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Map,
  FolderOpen,
  Download,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileJson,
  Image as ImageIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { parseUVTTFile, type UVTTImportResult } from '../importExport';

interface MapInfo {
  name: string;
  path: string;
  downloadUrl: string;
  previewUrl?: string;
  size: number;
}

interface DirectoryInfo {
  name: string;
  path: string;
}

interface VTTMapGalleryProps {
  onImportMap: (result: UVTTImportResult, filename: string) => Promise<void>;
  disabled?: boolean;
}

export function VTTMapGallery({ onImportMap, disabled }: VTTMapGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maps, setMaps] = useState<MapInfo[]>([]);
  const [directories, setDirectories] = useState<DirectoryInfo[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const { toast } = useToast();

  const loadMaps = useCallback(async (path: string = '') => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('vtt-maps-browser', {
        body: {
          action: 'list-maps',
          path,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setMaps(data.maps || []);
      setDirectories(data.directories || []);
      setCurrentPath(path);
    } catch (err) {
      console.error('Error loading maps:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar mapas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadMaps('');
      setPathHistory([]);
    }
  }, [isOpen, loadMaps]);

  const navigateToDirectory = (dirPath: string) => {
    setPathHistory([...pathHistory, currentPath]);
    loadMaps(dirPath);
  };

  const navigateBack = () => {
    const previousPath = pathHistory.pop() || '';
    setPathHistory([...pathHistory]);
    loadMaps(previousPath);
  };

  const navigateToBreadcrumb = (index: number) => {
    const pathParts = currentPath.split('/').filter(Boolean);
    const newPath = pathParts.slice(0, index).join('/');
    setPathHistory([...pathHistory, currentPath]);
    loadMaps(newPath);
  };

  const handleImportMap = async (map: MapInfo) => {
    setIsImporting(map.path);

    try {
      // Download the map file
      const { data, error: fnError } = await supabase.functions.invoke('vtt-maps-browser', {
        body: {
          action: 'download-map',
          path: map.downloadUrl,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse the UVTT file
      const result = parseUVTTFile(data.content, map.name);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar arquivo');
      }

      // Import the map
      await onImportMap(result, map.name);

      toast({
        title: 'Mapa importado!',
        description: `${map.name} foi importado com sucesso.`,
      });

      setIsOpen(false);
    } catch (err) {
      console.error('Error importing map:', err);
      toast({
        variant: 'destructive',
        title: 'Erro ao importar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    } finally {
      setIsImporting(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
          <Map className="w-4 h-4" />
          Mapas Prontos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Map className="w-5 h-5" />
            Galeria de Mapas VTT
          </DialogTitle>
          <DialogDescription>
            Mapas prontos com paredes e iluminação do repositório vtt-maps
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            {pathHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={navigateBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className="cursor-pointer hover:text-primary"
                    onClick={() => {
                      setPathHistory([...pathHistory, currentPath]);
                      loadMaps('');
                    }}
                  >
                    vtt-maps
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathParts.map((part, index) => (
                  <span key={index} className="contents">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        className="cursor-pointer hover:text-primary"
                        onClick={() => navigateToBreadcrumb(index + 1)}
                      >
                        {part}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://github.com/mbround18/vtt-maps', '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-video rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => loadMaps(currentPath)}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Directories */}
                {directories.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {directories.map((dir) => (
                      <Button
                        key={dir.path}
                        variant="outline"
                        className="h-auto py-3 justify-start gap-2"
                        onClick={() => navigateToDirectory(dir.path)}
                      >
                        <FolderOpen className="w-5 h-5 text-amber-500" />
                        <span className="truncate">{dir.name}</span>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Maps Grid */}
                {maps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {maps.map((map) => (
                      <div
                        key={map.path}
                        className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-all"
                      >
                        {/* Preview */}
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {map.previewUrl ? (
                            <img
                              src={map.previewUrl}
                              alt={map.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Map className="w-12 h-12 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Format badge */}
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="gap-1 bg-background/80 backdrop-blur-sm">
                              <FileJson className="w-3 h-3" />
                              UVTT
                            </Badge>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3 space-y-2">
                          <div>
                            <h4 className="font-semibold text-sm line-clamp-1">{map.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(map.size)}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            {map.previewUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => window.open(map.previewUrl, '_blank')}
                              >
                                <ImageIcon className="w-3 h-3 mr-1" />
                                Preview
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              className="flex-1 text-xs"
                              disabled={isImporting === map.path}
                              onClick={() => handleImportMap(map)}
                            >
                              {isImporting === map.path ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3 mr-1" />
                              )}
                              Importar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : directories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum mapa encontrado nesta pasta</p>
                  </div>
                ) : null}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
