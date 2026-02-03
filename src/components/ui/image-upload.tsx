import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useFileUpload, validateFile } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | 'auto';
  maxSizeMB?: number;
  resourceType?: string;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = 'Imagem',
  placeholder = 'Arraste uma imagem ou clique para selecionar',
  aspectRatio = 'auto',
  maxSizeMB = 10,
  resourceType = 'image',
  disabled = false,
  className,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, uploadProgress } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file
    const validation = validateFile(file, 'image');
    if (!validation.valid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`O arquivo deve ter no máximo ${maxSizeMB}MB`);
      return;
    }

    // Upload file
    const url = await uploadFile(file, resourceType);
    if (url) {
      onChange(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input to allow uploading the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    } else {
      setError('Por favor, envie apenas imagens');
    }
  }, [disabled]);

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-video',
    auto: 'min-h-[120px]',
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all overflow-hidden',
          aspectRatioClasses[aspectRatio],
          isDragging && 'border-primary bg-primary/5',
          error && 'border-destructive',
          !value && !isUploading && 'hover:border-primary/50 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          !isDragging && !error && 'border-border'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !value && inputRef.current?.click()}
      >
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <span className="text-sm text-muted-foreground">
              Enviando... {uploadProgress}%
            </span>
            <div className="w-32 h-1 mt-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                disabled={disabled}
              >
                <Upload className="w-4 h-4 mr-1" />
                Trocar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={disabled}
              >
                <X className="w-4 h-4 mr-1" />
                Remover
              </Button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {placeholder}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              PNG, JPG, WEBP até {maxSizeMB}MB
            </p>
          </div>
        )}

        <Input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
