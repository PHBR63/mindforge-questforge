import { useState } from 'react';
import { Folder, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { FolderTreeItem } from './types';

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderTreeItem[];
  onMove: (folderId: string | null) => void;
}

function FolderOption({
  folder,
  level,
  selectedId,
  onSelect,
}: {
  folder: FolderTreeItem;
  level: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <button
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left",
          selectedId === folder.id && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelect(folder.id)}
      >
        <Folder className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm truncate">{folder.name}</span>
        {folder.children.length > 0 && (
          <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
        )}
      </button>
      {folder.children.map((child) => (
        <FolderOption
          key={child.id}
          folder={child}
          level={level + 1}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

export function MoveToFolderDialog({
  open,
  onOpenChange,
  folders,
  onMove,
}: MoveToFolderDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleMove = () => {
    onMove(selectedId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Mover para Pasta</DialogTitle>
          <DialogDescription>
            Selecione a pasta de destino
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-64 overflow-auto space-y-1 py-2">
          {/* Root option */}
          <button
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left",
              selectedId === null && "bg-accent"
            )}
            onClick={() => setSelectedId(null)}
          >
            <Home className="w-4 h-4 text-primary" />
            <span className="text-sm">Raiz (Sem pasta)</span>
          </button>
          
          {folders.map((folder) => (
            <FolderOption
              key={folder.id}
              folder={folder}
              level={0}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleMove}>Mover</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
