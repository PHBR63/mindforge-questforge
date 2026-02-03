import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export function detectResourceType(file: File): string {
  const mimeType = file.type;
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || mimeType.includes('document') || mimeType === 'text/plain') return 'document';
  
  return 'other';
}

export function validateFile(file: File, type?: string): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'O tamanho máximo é 50MB' };
  }

  if (type && type !== 'other') {
    const acceptedTypes = ACCEPTED_FILE_TYPES[type] || [];
    if (acceptedTypes[0] !== '*/*' && !acceptedTypes.some(t => file.type.startsWith(t.replace('/*', '')))) {
      return { valid: false, error: `Tipo de arquivo inválido para ${type}` };
    }
  }

  return { valid: true };
}

interface UseFileUploadOptions {
  bucket?: string;
  onProgress?: (progress: number) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const { bucket = 'campaign-assets', onProgress } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = useCallback(async (file: File, resourceType: string): Promise<string | null> => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Usuário não autenticado' });
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${resourceType}/${timestamp}_${sanitizedName}`;

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          onProgress?.(newProgress);
          return newProgress;
        });
      }, 200);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setUploadProgress(100);
      onProgress?.(100);

      const { data: urlData } = supabase.storage
        .from(bucket)
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
  }, [user, bucket, toast, onProgress]);

  const uploadFiles = useCallback(async (
    files: File[],
    getResourceType?: (file: File) => string
  ): Promise<Array<{ file: File; url: string; type: string } | null>> => {
    const results: Array<{ file: File; url: string; type: string } | null> = [];

    for (const file of files) {
      const type = getResourceType ? getResourceType(file) : detectResourceType(file);
      const validation = validateFile(file, type);
      
      if (!validation.valid) {
        toast({ variant: 'destructive', title: 'Arquivo inválido', description: `${file.name}: ${validation.error}` });
        results.push(null);
        continue;
      }

      const url = await uploadFile(file, type);
      if (url) {
        results.push({ file, url, type });
      } else {
        results.push(null);
      }
    }

    return results;
  }, [uploadFile, toast]);

  return {
    uploadFile,
    uploadFiles,
    isUploading,
    uploadProgress,
    validateFile,
    detectResourceType,
    MAX_FILE_SIZE,
    ACCEPTED_FILE_TYPES,
  };
}
