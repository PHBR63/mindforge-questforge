import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image, FileText, Music, Video, Upload, X, Loader2 } from 'lucide-react';
import { resourceTypes } from './types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { detectResourceType, validateFile } from '@/hooks/useFileUpload';

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    type: string;
    file_url: string;
    thumbnail_url?: string;
    tags: string;
  }) => void;
  onSubmitMultiple?: (files: Array<{
    name: string;
    description: string;
    type: string;
    file_url: string;
    thumbnail_url?: string;
    tags: string;
  }>) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  FileText,
  Music,
  Video,
};

const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/webm'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  token: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  map: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  other: ['*/*'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface SelectedFile {
  file: File;
  previewUrl: string | null;
  name: string;
  type: string;
}

export function AddResourceDialog({ open, onOpenChange, onSubmit, onSubmitMultiple }: AddResourceDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'image',
    file_url: '',
    tags: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [useUrl, setUseUrl] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((files: File[]) => {
    const newSelectedFiles: SelectedFile[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({ 
          variant: 'destructive', 
          title: 'Arquivo muito grande', 
          description: `${file.name}: ${validation.error}` 
        });
        continue;
      }

      const detectedType = detectResourceType(file);
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      
      let previewUrl: string | null = null;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newSelectedFiles.push({
        file,
        previewUrl,
        name: fileName,
        type: detectedType,
      });
    }

    if (newSelectedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
      
      if (newSelectedFiles.length === 1 && selectedFiles.length === 0 && !formData.name.trim()) {
        setFormData(prev => ({ ...prev, name: newSelectedFiles[0].name }));
      }
    }
  }, [toast, selectedFiles.length, formData.name]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const file = prev[index];
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAllFiles = () => {
    selectedFiles.forEach(f => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File, resourceType: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${resourceType}/${timestamp}_${sanitizedName}`;

      const { data, error } = await supabase.storage
        .from('campaign-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    // Single file or URL mode
    if (selectedFiles.length <= 1 && !onSubmitMultiple) {
      if (!formData.name.trim()) {
        toast({ variant: 'destructive', title: 'Nome obrigatório' });
        return;
      }

      let fileUrl = formData.file_url;

      if (selectedFiles.length === 1) {
        setIsUploading(true);
        setUploadProgress(0);
        
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
          const uploadedUrl = await uploadFile(selectedFiles[0].file, selectedFiles[0].type);
          clearInterval(progressInterval);
          
          if (!uploadedUrl) {
            toast({ variant: 'destructive', title: 'Erro no upload' });
            setIsUploading(false);
            return;
          }
          fileUrl = uploadedUrl;
          setUploadProgress(100);
        } catch (error: any) {
          clearInterval(progressInterval);
          toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
          setIsUploading(false);
          return;
        }
      }

      onSubmit({
        ...formData,
        file_url: fileUrl,
        thumbnail_url: fileUrl,
      });

      resetForm();
      return;
    }

    // Multiple files mode
    if (selectedFiles.length > 1 && onSubmitMultiple) {
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentUploadIndex(0);

      const uploadedResources: Array<{
        name: string;
        description: string;
        type: string;
        file_url: string;
        thumbnail_url?: string;
        tags: string;
      }> = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentUploadIndex(i);
        const selectedFile = selectedFiles[i];
        
        try {
          const uploadedUrl = await uploadFile(selectedFile.file, selectedFile.type);
          if (uploadedUrl) {
            uploadedResources.push({
              name: selectedFile.name,
              description: formData.description,
              type: selectedFile.type,
              file_url: uploadedUrl,
              thumbnail_url: uploadedUrl,
              tags: formData.tags,
            });
          }
        } catch (error: any) {
          toast({ 
            variant: 'destructive', 
            title: `Erro ao enviar ${selectedFile.name}`, 
            description: error.message 
          });
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      if (uploadedResources.length > 0) {
        onSubmitMultiple(uploadedResources);
        toast({ 
          title: 'Upload concluído', 
          description: `${uploadedResources.length} de ${selectedFiles.length} arquivos enviados` 
        });
      }

      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', type: 'image', file_url: '', tags: '' });
    clearAllFiles();
    setUseUrl(false);
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadIndex(0);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const getAcceptString = () => {
    // Accept all supported types for multiple files
    const allTypes = Object.values(ACCEPTED_FILE_TYPES).flat().filter(t => t !== '*/*');
    return allTypes.join(',');
  };

  const isSingleFileMode = selectedFiles.length <= 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar Recursos</DialogTitle>
          <DialogDescription>
            Faça upload de imagens, áudios, vídeos, tokens e outros recursos. Você pode selecionar múltiplos arquivos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          {!useUrl && (
            <div className="space-y-2">
              <Label>Arquivos</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isDragging && "border-primary bg-primary/10 scale-[1.02]",
                  selectedFiles.length > 0 ? "border-primary bg-primary/5" : "border-border"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptString()}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                />
                
                {selectedFiles.length > 0 ? (
                  <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedFiles.slice(0, 6).map((selectedFile, index) => (
                        <div key={index} className="relative group">
                          {selectedFile.previewUrl ? (
                            <img 
                              src={selectedFile.previewUrl} 
                              alt={selectedFile.name}
                              className="w-full h-20 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-full h-20 bg-muted rounded-md flex items-center justify-center">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-[10px] text-muted-foreground truncate mt-1">
                            {selectedFile.name}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    {selectedFiles.length > 6 && (
                      <p className="text-xs text-muted-foreground">
                        +{selectedFiles.length - 6} mais arquivo(s)
                      </p>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Adicionar mais
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFiles}
                      >
                        Limpar tudo
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {selectedFiles.length} arquivo(s) selecionado(s)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Clique para selecionar</p>
                      <p className="text-xs text-muted-foreground">ou arraste arquivos aqui</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Suporta múltiplos arquivos • Máximo: 50MB cada</p>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setUseUrl(true)}
                className="text-xs text-primary hover:underline"
              >
                Usar URL externa
              </button>
            </div>
          )}

          {/* URL Input */}
          {useUrl && (
            <div className="space-y-2">
              <Label>URL do Arquivo</Label>
              <Input
                placeholder="https://..."
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              />
              <button
                type="button"
                onClick={() => { setUseUrl(false); setFormData({ ...formData, file_url: '' }); }}
                className="text-xs text-primary hover:underline"
              >
                Fazer upload de arquivo
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {selectedFiles.length > 1 
                  ? `Enviando ${currentUploadIndex + 1} de ${selectedFiles.length}... ${uploadProgress}%`
                  : `Enviando... ${uploadProgress}%`
                }
              </p>
            </div>
          )}

          {/* Single file mode: show name and type fields */}
          {isSingleFileMode && (
            <>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((t) => {
                      const IconComponent = iconMap[t.icon] || FileText;
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            {t.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Nome do recurso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label>Descrição {selectedFiles.length > 1 && '(aplicada a todos)'}</Label>
            <Textarea
              placeholder="Descrição do recurso..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tags {selectedFiles.length > 1 && '(aplicadas a todos)'}</Label>
            <Input
              placeholder="mapa, cidade, fantasia..."
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isUploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || (selectedFiles.length === 0 && !formData.file_url) || (isSingleFileMode && !formData.name.trim())}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              selectedFiles.length > 1 ? `Adicionar ${selectedFiles.length} arquivos` : 'Adicionar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
