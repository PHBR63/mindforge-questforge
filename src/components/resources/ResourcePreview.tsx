import { X, Star, ExternalLink, Trash2, FolderInput, Image, FileText, Music, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Resource, resourceTypes } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ResourcePreviewProps {
  resource: Resource | null;
  onClose: () => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDelete: (id: string) => void;
  onMoveToFolder: (id: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  FileText,
  Music,
  Video,
};

export function ResourcePreview({
  resource,
  onClose,
  onToggleFavorite,
  onDelete,
  onMoveToFolder,
}: ResourcePreviewProps) {
  if (!resource) {
    return (
      <div className="w-80 border-l border-border/50 bg-card/30 flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground text-center">
          Selecione um arquivo para ver detalhes
        </p>
      </div>
    );
  }

  const typeInfo = resourceTypes.find(t => t.value === resource.type);
  const IconComponent = iconMap[typeInfo?.icon || 'FileText'] || FileText;
  const isVisual = ['image', 'token', 'map'].includes(resource.type);

  return (
    <div className="w-80 border-l border-border/50 bg-card/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold truncate flex-1">{resource.name}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Preview Area */}
      <div className="p-4 border-b border-border/50">
        <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {resource.file_url && isVisual ? (
            <img
              src={resource.file_url}
              alt={resource.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <IconComponent className="w-20 h-20 text-muted-foreground/50" />
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-3 border-b border-border/50 flex gap-2 flex-wrap">
        <Button
          variant={resource.is_favorite ? "default" : "outline"}
          size="sm"
          onClick={() => onToggleFavorite(resource.id, !resource.is_favorite)}
          className="flex-1"
        >
          <Star className={resource.is_favorite ? "w-4 h-4 mr-1 fill-current" : "w-4 h-4 mr-1"} />
          {resource.is_favorite ? "Favoritado" : "Favoritar"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMoveToFolder(resource.id)}
          className="flex-1"
        >
          <FolderInput className="w-4 h-4 mr-1" />
          Mover
        </Button>
      </div>
      
      {/* Details */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Tipo</label>
          <p className="text-sm mt-1 flex items-center gap-2">
            <IconComponent className="w-4 h-4 text-primary" />
            {typeInfo?.label || resource.type}
          </p>
        </div>
        
        {resource.description && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Descrição</label>
            <p className="text-sm mt-1 text-foreground/80">{resource.description}</p>
          </div>
        )}
        
        {resource.tags && resource.tags.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide">Tags</label>
            <div className="flex flex-wrap gap-1 mt-2">
              {resource.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Criado em</label>
          <p className="text-sm mt-1">
            {format(new Date(resource.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        
        {resource.is_global && (
          <div>
            <Badge variant="outline" className="text-xs">
              Recurso Global
            </Badge>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {resource.file_url && (
          <Button variant="outline" size="sm" className="w-full" asChild>
            <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Arquivo
            </a>
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDelete(resource.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir Recurso
        </Button>
      </div>
    </div>
  );
}
