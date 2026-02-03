import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Box,
  RotateCcw,
  Move,
  Maximize2,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Map3DModel, validate3DFile, SUPPORTED_3D_FORMATS } from './model3DTypes';
import { Model3DViewer } from './Model3DViewer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Model3DLibraryProps {
  mapId: string;
  models: Map3DModel[];
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
  onModelCreate: (model: Omit<Map3DModel, 'id' | 'map_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onModelUpdate: (modelId: string, updates: Partial<Map3DModel>) => void;
  onModelDelete: (modelId: string) => void;
}

export function Model3DLibrary({
  mapId,
  models,
  selectedModelId,
  onModelSelect,
  onModelCreate,
  onModelUpdate,
  onModelDelete,
}: Model3DLibraryProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTransform, setPreviewTransform] = useState<{
    rotation: [number, number, number];
    scale: number;
  }>({ rotation: [0, 0, 0], scale: 1 });

  const [viewingModel, setViewingModel] = useState<Map3DModel | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectedModel = models.find((m) => m.id === selectedModelId);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const validation = validate3DFile(file);

      if (!validation.valid) {
        toast({
          variant: 'destructive',
          title: 'Arquivo inválido',
          description: validation.error,
        });
        return;
      }

      setUploadFile(file);
      setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      setPreviewUrl(URL.createObjectURL(file));
      setIsUploadOpen(true);
    },
    [toast]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!uploadFile || !user) return;

    setIsUploading(true);

    try {
      const fileName = `3d-models/${mapId}/${Date.now()}-${uploadFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-assets')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(fileName);

      onModelCreate({
        name: uploadName,
        file_url: urlData.publicUrl,
        thumbnail_url: null,
        position_x: 0,
        position_y: 0,
        position_z: 0,
        rotation_x: previewTransform.rotation[0],
        rotation_y: previewTransform.rotation[1],
        rotation_z: previewTransform.rotation[2],
        scale: previewTransform.scale,
        layer: 0,
        is_visible: true,
        animation_name: null,
        animation_playing: false,
        metadata: null,
      });

      toast({
        title: 'Modelo carregado!',
        description: `${uploadName} foi adicionado à biblioteca.`,
      });

      // Cleanup
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setUploadFile(null);
      setUploadName('');
      setPreviewUrl(null);
      setPreviewTransform({ rotation: [0, 0, 0], scale: 1 });
      setIsUploadOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setUploadFile(null);
    setUploadName('');
    setPreviewUrl(null);
    setPreviewTransform({ rotation: [0, 0, 0], scale: 1 });
    setIsUploadOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="w-72 bg-card rounded-lg border border-border p-3 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm">Modelos 3D</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_3D_FORMATS.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-3 mb-3 text-center transition-all cursor-pointer',
            'hover:border-primary/50 hover:bg-primary/5',
            isDragging && 'border-primary bg-primary/10 scale-[1.02]'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Arraste um arquivo .gltf ou .glb
          </p>
        </div>

        {/* Models list */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {models.map((model) => (
              <div
                key={model.id}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors',
                  selectedModelId === model.id
                    ? 'bg-primary/20 border border-primary'
                    : 'hover:bg-muted/50 border border-transparent'
                )}
                onClick={() => onModelSelect(model.id)}
              >
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                  {model.thumbnail_url ? (
                    <img
                      src={model.thumbnail_url}
                      alt={model.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Box className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{model.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Escala: {model.scale.toFixed(1)}x
                  </p>
                </div>

                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onModelUpdate(model.id, { is_visible: !model.is_visible });
                        }}
                      >
                        {model.is_visible ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visibilidade</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingModel(model);
                        }}
                      >
                        <Maximize2 className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualizar</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}

            {models.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                Nenhum modelo 3D.
                <br />
                Arraste um arquivo para começar.
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Selected model controls */}
        {selectedModel && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate">{selectedModel.name}</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onModelDelete(selectedModel.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Move className="w-3 h-3 text-muted-foreground" />
                <Label className="text-xs">Posição</Label>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <Input
                  type="number"
                  value={selectedModel.position_x}
                  onChange={(e) =>
                    onModelUpdate(selectedModel.id, { position_x: parseFloat(e.target.value) || 0 })
                  }
                  className="h-7 text-xs"
                  placeholder="X"
                />
                <Input
                  type="number"
                  value={selectedModel.position_y}
                  onChange={(e) =>
                    onModelUpdate(selectedModel.id, { position_y: parseFloat(e.target.value) || 0 })
                  }
                  className="h-7 text-xs"
                  placeholder="Y"
                />
                <Input
                  type="number"
                  value={selectedModel.position_z}
                  onChange={(e) =>
                    onModelUpdate(selectedModel.id, { position_z: parseFloat(e.target.value) || 0 })
                  }
                  className="h-7 text-xs"
                  placeholder="Z"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Escala: {selectedModel.scale.toFixed(2)}x</Label>
              <Slider
                value={[selectedModel.scale]}
                onValueChange={([v]) => onModelUpdate(selectedModel.id, { scale: v })}
                min={0.1}
                max={5}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-3 h-3 text-muted-foreground" />
                <Label className="text-xs">Rotação Y: {selectedModel.rotation_y}°</Label>
              </div>
              <Slider
                value={[selectedModel.rotation_y]}
                onValueChange={([v]) => onModelUpdate(selectedModel.id, { rotation_y: v })}
                min={-180}
                max={180}
                step={15}
              />
            </div>

            {/* Animation controls */}
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs">Animação</Label>
              <Select
                value={selectedModel.animation_name || ''}
                onValueChange={(v) =>
                  onModelUpdate(selectedModel.id, {
                    animation_name: v || null,
                    animation_playing: !!v,
                  })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Nenhuma animação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="walk">Walk</SelectItem>
                  <SelectItem value="run">Run</SelectItem>
                  <SelectItem value="attack">Attack</SelectItem>
                </SelectContent>
              </Select>

              {selectedModel.animation_name && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedModel.animation_playing ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 flex-1 gap-1"
                    onClick={() =>
                      onModelUpdate(selectedModel.id, {
                        animation_playing: !selectedModel.animation_playing,
                      })
                    }
                  >
                    {selectedModel.animation_playing ? (
                      <>
                        <Pause className="w-3 h-3" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" /> Reproduzir
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload dialog */}
        <Dialog open={isUploadOpen} onOpenChange={handleCloseUpload}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Adicionar Modelo 3D</DialogTitle>
              <DialogDescription>
                Ajuste as configurações iniciais do modelo antes de adicionar ao mapa
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Nome do Modelo</Label>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Nome do modelo"
                />
              </div>

              {previewUrl && (
                <Model3DViewer
                  modelUrl={previewUrl}
                  showControls={true}
                  height="300px"
                  initialRotation={previewTransform.rotation}
                  initialScale={previewTransform.scale}
                  onTransformChange={setPreviewTransform}
                />
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseUpload}>
                Cancelar
              </Button>
              <Button onClick={handleUpload} disabled={isUploading || !uploadName.trim()}>
                {isUploading ? 'Carregando...' : 'Adicionar ao Mapa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View model dialog */}
        <Dialog open={!!viewingModel} onOpenChange={() => setViewingModel(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">{viewingModel?.name}</DialogTitle>
            </DialogHeader>

            {viewingModel && (
              <Model3DViewer
                modelUrl={viewingModel.file_url}
                showControls={true}
                height="500px"
                initialRotation={[
                  viewingModel.rotation_x,
                  viewingModel.rotation_y,
                  viewingModel.rotation_z,
                ]}
                initialScale={viewingModel.scale}
                onTransformChange={(transform) => {
                  onModelUpdate(viewingModel.id, {
                    rotation_x: transform.rotation[0],
                    rotation_y: transform.rotation[1],
                    rotation_z: transform.rotation[2],
                    scale: transform.scale,
                  });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
