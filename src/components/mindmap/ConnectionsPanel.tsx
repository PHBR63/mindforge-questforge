import { Edge } from '@xyflow/react';
import { Pencil, Trash2, Link2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CONNECTION_TYPES, MindMapNodeData } from './types';

interface ConnectionsPanelProps {
  open: boolean;
  onClose: () => void;
  edges: Edge[];
  nodeDataMap: Map<string, MindMapNodeData>;
  onEdit: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
}

export function ConnectionsPanel({
  open,
  onClose,
  edges,
  nodeDataMap,
  onEdit,
  onDelete,
}: ConnectionsPanelProps) {
  if (!open) return null;

  const getNodeTitle = (nodeId: string) => {
    return nodeDataMap.get(nodeId)?.title || 'Desconhecido';
  };

  const getConnectionType = (edge: Edge) => {
    const type = (edge.data as any)?.connectionType || 'default';
    return CONNECTION_TYPES.find((t) => t.value === type) || CONNECTION_TYPES[0];
  };

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="font-display font-bold text-sm">Conexões</h3>
          <span className="text-xs text-muted-foreground">({edges.length})</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Connections list */}
      <ScrollArea className="flex-1">
        {edges.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Link2 className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma conexão criada</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {edges.map((edge) => {
              const connType = getConnectionType(edge);
              const label = (edge.data as any)?.label;

              return (
                <div
                  key={edge.id}
                  className="group flex items-start gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  {/* Color indicator */}
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{ background: connType.color }}
                  />

                  {/* Connection info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {getNodeTitle(edge.source)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>→</span>
                      <span className="truncate">{getNodeTitle(edge.target)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-muted-foreground">{connType.label}</span>
                      {label && (
                        <span className="text-xs text-foreground/70 italic">· {label}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onEdit(edge.id)}
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => onDelete(edge.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
