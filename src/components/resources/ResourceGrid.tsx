import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Image, FileText, Music, Video, MoreVertical, Trash2, ExternalLink, FolderInput, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Resource, resourceTypes } from './types';
import { cn } from '@/lib/utils';
import { useFileUpload, detectResourceType, validateFile } from '@/hooks/useFileUpload';

interface ResourceGridProps {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (resource: Resource) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onMoveToFolder: (id: string) => void;
  isLoading: boolean;
  onFilesDropped?: (files: Array<{ name: string; type: string; url: string }>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  FileText,
  Music,
  Video,
};

export function ResourceGrid({
  resources,
  selectedId,
  onSelect,
  onToggleFavorite,
  onDelete,
  onMoveToFolder,
  isLoading,
  onFilesDropped,
}: ResourceGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const { uploadFiles, isUploading, uploadProgress } = useFileUpload();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the container entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!onFilesDropped) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // Filter and validate files
    const validFiles: File[] = [];
    for (const file of droppedFiles) {
      const type = detectResourceType(file);
      const validation = validateFile(file, type);
      if (validation.valid) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    // Track uploading files
    setUploadingFiles(validFiles.map(f => f.name));

    // Upload files
    const results = await uploadFiles(validFiles);
    
    // Clear uploading state
    setUploadingFiles([]);

    // Notify parent of successful uploads
    const successfulUploads = results
      .filter((r): r is { file: File; url: string; type: string } => r !== null)
      .map(r => ({
        name: r.file.name.replace(/\.[^/.]+$/, ''),
        type: r.type,
        url: r.url,
      }));

    if (successfulUploads.length > 0) {
      onFilesDropped(successfulUploads);
    }
  }, [onFilesDropped, uploadFiles]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-square bg-muted rounded-t-lg" />
            <CardContent className="p-3">
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative min-h-[400px] transition-colors",
        isDragging && "bg-primary/5"
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg pointer-events-none">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-primary mb-2" />
            <p className="text-lg font-medium text-primary">Solte os arquivos aqui</p>
            <p className="text-sm text-muted-foreground">Imagens, áudios, vídeos, documentos...</p>
          </div>
        </div>
      )}

      {/* Uploading Indicator */}
      {isUploading && uploadingFiles.length > 0 && (
        <div className="absolute top-4 left-4 right-4 z-40 bg-card border border-border rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium">Enviando {uploadingFiles.length} arquivo(s)...</p>
              <Progress value={uploadProgress} className="h-2 mt-2" />
            </div>
          </div>
        </div>
      )}

      {resources.length === 0 && !isDragging ? (
        <div className="flex-1 flex items-center justify-center p-8 min-h-[400px]">
          <div className="text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">Nenhum arquivo nesta pasta</p>
            <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou clique em "Adicionar Recurso"</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4">
          {resources.map((resource, index) => {
            const typeInfo = resourceTypes.find(t => t.value === resource.type);
            const IconComponent = iconMap[typeInfo?.icon || 'FileText'] || FileText;
            const isVisual = ['image', 'token', 'map'].includes(resource.type);
            const isSelected = resource.id === selectedId;

            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden cursor-pointer transition-all group hover:border-primary/50 hover:shadow-md",
                    isSelected && "ring-2 ring-primary border-primary"
                  )}
                  onClick={() => onSelect(resource)}
                >
                  <div className="aspect-square bg-muted relative flex items-center justify-center">
                    {resource.file_url && isVisual ? (
                      <img
                        src={resource.file_url}
                        alt={resource.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <IconComponent className="w-12 h-12 text-muted-foreground/50" />
                    )}
                    
                    {/* Favorite indicator */}
                    {resource.is_favorite && (
                      <div className="absolute top-2 left-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                    
                    {/* Actions overlay */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(resource.id, !resource.is_favorite);
                          }}>
                            <Star className={cn("w-4 h-4 mr-2", resource.is_favorite && "fill-yellow-500 text-yellow-500")} />
                            {resource.is_favorite ? "Remover Favorito" : "Favoritar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onMoveToFolder(resource.id);
                          }}>
                            <FolderInput className="w-4 h-4 mr-2" />
                            Mover para Pasta
                          </DropdownMenuItem>
                          {resource.file_url && (
                            <DropdownMenuItem asChild>
                              <a href={resource.file_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Abrir
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(resource.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm truncate">{resource.name}</h4>
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {resource.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {resource.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            +{resource.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
