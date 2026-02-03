import { motion } from 'framer-motion';
import { Star, Image, FileText, Music, Video, MoreVertical, Trash2, ExternalLink, FolderInput } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Resource, resourceTypes } from './types';
import { cn } from '@/lib/utils';

interface ResourceGridProps {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (resource: Resource) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onMoveToFolder: (id: string) => void;
  isLoading: boolean;
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
}: ResourceGridProps) {
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

  if (resources.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum arquivo nesta pasta</p>
        </div>
      </div>
    );
  }

  return (
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
  );
}
