import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCampaignContext } from '@/contexts/CampaignContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, ChevronRight, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FolderTree } from '@/components/resources/FolderTree';
import { ResourceGrid } from '@/components/resources/ResourceGrid';
import { ResourcePreview } from '@/components/resources/ResourcePreview';
import { AddResourceDialog } from '@/components/resources/AddResourceDialog';
import { MoveToFolderDialog } from '@/components/resources/MoveToFolderDialog';
import { Resource, ResourceFolder, FolderTreeItem } from '@/components/resources/types';

export default function Resources() {
  const { activeCampaign } = useCampaignContext();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [resources, setResources] = useState<Resource[]>([]);
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showingFavorites, setShowingFavorites] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [resourceToMove, setResourceToMove] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeCampaign, user]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    
    // Load folders
    let foldersQuery = supabase
      .from('resource_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (activeCampaign) {
      foldersQuery = foldersQuery.or(`campaign_id.eq.${activeCampaign.id},is_global.eq.true`);
    } else {
      foldersQuery = foldersQuery.eq('is_global', true);
    }
    
    // Load resources
    let resourcesQuery = supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (activeCampaign) {
      resourcesQuery = resourcesQuery.or(`campaign_id.eq.${activeCampaign.id},is_global.eq.true`);
    } else {
      resourcesQuery = resourcesQuery.eq('is_global', true);
    }
    
    const [foldersResult, resourcesResult] = await Promise.all([
      foldersQuery,
      resourcesQuery,
    ]);
    
    if (foldersResult.error) {
      toast({ variant: 'destructive', title: 'Erro', description: foldersResult.error.message });
    } else {
      setFolders(foldersResult.data || []);
    }
    
    if (resourcesResult.error) {
      toast({ variant: 'destructive', title: 'Erro', description: resourcesResult.error.message });
    } else {
      setResources((resourcesResult.data || []) as Resource[]);
    }
    
    setIsLoading(false);
  };

  // Build folder tree structure
  const folderTree = useMemo(() => {
    const buildTree = (parentId: string | null): FolderTreeItem[] => {
      return folders
        .filter(f => f.parent_id === parentId)
        .map(f => ({
          ...f,
          children: buildTree(f.id),
        }));
    };
    return buildTree(null);
  }, [folders]);

  // Get current breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path: ResourceFolder[] = [];
    let current = folders.find(f => f.id === currentFolderId);
    while (current) {
      path.unshift(current);
      current = folders.find(f => f.id === current?.parent_id);
    }
    return path;
  }, [folders, currentFolderId]);

  // Filter resources based on current view
  const filteredResources = useMemo(() => {
    let result = resources;
    
    if (showingFavorites) {
      result = result.filter(r => r.is_favorite);
    } else {
      result = result.filter(r => r.folder_id === currentFolderId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term) ||
        r.tags?.some(t => t.toLowerCase().includes(term))
      );
    }
    
    return result;
  }, [resources, currentFolderId, showingFavorites, searchTerm]);

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setShowingFavorites(false);
    setSelectedResource(null);
  };

  const handleShowFavorites = () => {
    setShowingFavorites(true);
    setCurrentFolderId(null);
    setSelectedResource(null);
  };

  const handleCreateFolder = async (name: string, parentId: string | null) => {
    if (!user) return;
    
    const { error } = await supabase.from('resource_folders').insert({
      name,
      parent_id: parentId,
      user_id: user.id,
      campaign_id: activeCampaign?.id || null,
      is_global: !activeCampaign,
    });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Pasta criada!' });
      loadData();
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const { error } = await supabase.from('resource_folders').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Pasta excluída' });
      if (currentFolderId === id) setCurrentFolderId(null);
      loadData();
    }
  };

  const handleRenameFolder = async (id: string, name: string) => {
    const { error } = await supabase.from('resource_folders').update({ name }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      loadData();
    }
  };

  const handleCreateResource = async (data: {
    name: string;
    description: string;
    type: string;
    file_url: string;
    thumbnail_url?: string;
    tags: string;
  }) => {
    if (!user) return;
    
    const { error } = await supabase.from('resources').insert({
      name: data.name,
      description: data.description || null,
      type: data.type,
      file_url: data.file_url || null,
      thumbnail_url: data.thumbnail_url || null,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()) : null,
      folder_id: currentFolderId,
      user_id: user.id,
      campaign_id: activeCampaign?.id || null,
      is_global: !activeCampaign,
    });
    
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Recurso adicionado!' });
      setIsAddDialogOpen(false);
      loadData();
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    const { error } = await supabase.from('resources').update({ is_favorite: isFavorite }).eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      setResources(prev => prev.map(r => r.id === id ? { ...r, is_favorite: isFavorite } : r));
      if (selectedResource?.id === id) {
        setSelectedResource(prev => prev ? { ...prev, is_favorite: isFavorite } : null);
      }
    }
  };

  const handleDeleteResource = async (id: string) => {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Recurso excluído' });
      if (selectedResource?.id === id) setSelectedResource(null);
      loadData();
    }
  };

  const handleMoveResource = async (folderId: string | null) => {
    if (!resourceToMove) return;
    
    const { error } = await supabase.from('resources').update({ folder_id: folderId }).eq('id', resourceToMove);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Recurso movido!' });
      setResourceToMove(null);
      loadData();
    }
  };

  const openMoveDialog = (id: string) => {
    setResourceToMove(id);
    setIsMoveDialogOpen(true);
  };

  return (
    <AppLayout
      title="Biblioteca de Recursos"
      actions={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar recursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="glow-gold">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Recurso
          </Button>
        </div>
      }
    >
      <div className="flex h-[calc(100vh-8rem)] -m-6 bg-background">
        {/* Folder Tree Sidebar */}
        <FolderTree
          folders={folderTree}
          currentFolderId={currentFolderId}
          onFolderSelect={handleFolderSelect}
          onShowFavorites={handleShowFavorites}
          showingFavorites={showingFavorites}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={handleRenameFolder}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumb */}
          <div className="h-10 border-b border-border/50 flex items-center px-4 gap-1 text-sm bg-card/30">
            <button
              onClick={() => handleFolderSelect(null)}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span>Raiz</span>
            </button>
            {breadcrumbPath.map((folder) => (
              <div key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => handleFolderSelect(folder.id)}
                  className="hover:text-primary transition-colors"
                >
                  {folder.name}
                </button>
              </div>
            ))}
            {showingFavorites && (
              <>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-primary">Favoritos</span>
              </>
            )}
          </div>
          
          {/* Resource Grid */}
          <div className="flex-1 overflow-auto">
            <ResourceGrid
              resources={filteredResources}
              selectedId={selectedResource?.id || null}
              onSelect={setSelectedResource}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteResource}
              onMoveToFolder={openMoveDialog}
              isLoading={isLoading}
            />
          </div>
        </div>
        
        {/* Preview Panel */}
        <ResourcePreview
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDeleteResource}
          onMoveToFolder={openMoveDialog}
        />
      </div>
      
      {/* Dialogs */}
      <AddResourceDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleCreateResource}
      />
      
      <MoveToFolderDialog
        open={isMoveDialogOpen}
        onOpenChange={setIsMoveDialogOpen}
        folders={folderTree}
        onMove={handleMoveResource}
      />
    </AppLayout>
  );
}
