export interface ResourceFolder {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  campaign_id: string | null;
  is_global: boolean;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  type: string;
  file_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  is_global: boolean;
  folder_id: string | null;
  is_favorite: boolean;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderTreeItem extends ResourceFolder {
  children: FolderTreeItem[];
}

export const resourceTypes = [
  { value: 'image', label: 'Imagem', icon: 'Image' },
  { value: 'document', label: 'Documento', icon: 'FileText' },
  { value: 'audio', label: 'Áudio', icon: 'Music' },
  { value: 'video', label: 'Vídeo', icon: 'Video' },
  { value: 'token', label: 'Token', icon: 'Image' },
  { value: 'map', label: 'Mapa', icon: 'Image' },
  { value: 'other', label: 'Outro', icon: 'FileText' },
] as const;
