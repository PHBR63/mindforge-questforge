import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Star, Home, Plus, MoreVertical, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderTreeItem } from './types';

interface FolderTreeProps {
  folders: FolderTreeItem[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onShowFavorites: () => void;
  showingFavorites: boolean;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
}

interface FolderNodeProps {
  folder: FolderTreeItem;
  level: number;
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
}

function FolderNode({ 
  folder, 
  level, 
  currentFolderId, 
  onFolderSelect,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const hasChildren = folder.children.length > 0;
  const isSelected = folder.id === currentFolderId;

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRenameFolder(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer group hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent text-accent-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className={cn("p-0.5 hover:bg-accent rounded", !hasChildren && "invisible")}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-primary shrink-0" />
        )}
        
        {isRenaming ? (
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
            className="h-6 py-0 text-sm"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="flex-1 text-sm truncate"
            onClick={() => onFolderSelect(folder.id)}
          >
            {folder.name}
          </span>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              const name = prompt('Nome da nova pasta:');
              if (name) onCreateFolder(name, folder.id);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Subpasta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDeleteFolder(folder.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {folder.children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onFolderSelect={onFolderSelect}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              onRenameFolder={onRenameFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  currentFolderId,
  onFolderSelect,
  onShowFavorites,
  showingFavorites,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder,
}: FolderTreeProps) {
  return (
    <div className="w-64 border-r border-border/50 bg-card/50 flex flex-col h-full">
      <div className="p-3 border-b border-border/50">
        <h3 className="font-display text-sm font-semibold text-foreground/80">Navegação</h3>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-1">
        {/* Root / Home */}
        <div
          onClick={() => onFolderSelect(null)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
            currentFolderId === null && !showingFavorites && "bg-accent text-accent-foreground"
          )}
        >
          <Home className="w-4 h-4 text-primary" />
          <span className="text-sm">Todos os Arquivos</span>
        </div>
        
        {/* Favorites */}
        <div
          onClick={onShowFavorites}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
            showingFavorites && "bg-accent text-accent-foreground"
          )}
        >
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="text-sm">Favoritos</span>
        </div>
        
        <div className="h-px bg-border/50 my-2" />
        
        {/* Folder Tree */}
        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            level={0}
            currentFolderId={currentFolderId}
            onFolderSelect={onFolderSelect}
            onCreateFolder={onCreateFolder}
            onDeleteFolder={onDeleteFolder}
            onRenameFolder={onRenameFolder}
          />
        ))}
      </div>
      
      <div className="p-2 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            const name = prompt('Nome da nova pasta:');
            if (name) onCreateFolder(name, null);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Pasta
        </Button>
      </div>
    </div>
  );
}
