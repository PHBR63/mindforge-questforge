import { useState, useRef } from 'react';
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

export function AddResourceDialog({ open, onOpenChange, onSubmit }: AddResourceDialogProps) {
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useUrl, setUseUrl] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        variant: 'destructive', 
        title: 'Arquivo muito grande', 
        description: 'O tamanho máximo é 50MB' 
      });
      return;
    }

    // Validate file type
    const acceptedTypes = ACCEPTED_FILE_TYPES[formData.type] || [];
    if (acceptedTypes[0] !== '*/*' && !acceptedTypes.some(t => file.type.startsWith(t.replace('/*', '')))) {
      toast({ 
        variant: 'destructive', 
        title: 'Tipo de arquivo inválido', 
        description: `Selecione um arquivo do tipo: ${formData.type}` 
      });
      return;
    }

    setSelectedFile(file);
    
    // Auto-fill name if empty
    if (!formData.name.trim()) {
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setFormData(prev => ({ ...prev, name: fileName }));
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create unique file path: userId/type/timestamp_filename
      const timestamp = Date.now();
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${formData.type}/${timestamp}_${sanitizedName}`;

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from('campaign-assets')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setUploadProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('campaign-assets')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro no upload', 
        description: error.message || 'Não foi possível fazer o upload do arquivo' 
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', title: 'Nome obrigatório' });
      return;
    }

    let fileUrl = formData.file_url;

    // Upload file if selected
    if (selectedFile) {
      const uploadedUrl = await uploadFile();
      if (!uploadedUrl) return;
      fileUrl = uploadedUrl;
    }

    onSubmit({
      ...formData,
      file_url: fileUrl,
      thumbnail_url: fileUrl, // For images, use same URL as thumbnail
    });

    // Reset form
    setFormData({ name: '', description: '', type: 'image', file_url: '', tags: '' });
    clearFile();
    setUseUrl(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      clearFile();
      setFormData({ name: '', description: '', type: 'image', file_url: '', tags: '' });
      setUseUrl(false);
    }
    onOpenChange(isOpen);
  };

  const getAcceptString = () => {
    const types = ACCEPTED_FILE_TYPES[formData.type] || [];
    if (types[0] === '*/*') return undefined;
    return types.join(',');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar Recurso</DialogTitle>
          <DialogDescription>
            Faça upload de imagens, áudios, vídeos, tokens e outros recursos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select 
              value={formData.type} 
              onValueChange={(v) => {
                setFormData({ ...formData, type: v });
                clearFile();
              }}
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

          {/* File Upload Area */}
          {!useUrl && (
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                  "hover:border-primary/50 hover:bg-primary/5",
                  selectedFile ? "border-primary bg-primary/5" : "border-border"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptString()}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    {previewUrl ? (
                      <div className="relative inline-block">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-32 mx-auto rounded-md"
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-8 h-8 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearFile(); }}
                          className="p-1 hover:bg-destructive/10 rounded"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Clique para selecionar</p>
                      <p className="text-xs text-muted-foreground">ou arraste um arquivo aqui</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Máximo: 50MB</p>
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
                Enviando... {uploadProgress}%
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              placeholder="Nome do recurso"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descrição do recurso..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
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
          <Button onClick={handleSubmit} disabled={isUploading || (!selectedFile && !formData.file_url && !formData.name)}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Adicionar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
