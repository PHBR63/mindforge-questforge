export interface InvestigationBoard {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  description: string | null;
  background_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestigationClue {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  content: string | null;
  clue_type: string | null;
  image_url: string | null;
  color: string | null;
  position_x: number;
  position_y: number;
  is_pinned: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface InvestigationConnection {
  id: string;
  board_id: string;
  user_id: string;
  source_clue_id: string;
  target_clue_id: string;
  label: string | null;
  color: string | null;
  created_at: string;
}

export const CLUE_TYPES = [
  { value: 'evidence', label: 'Evidência', color: '#dc2626', icon: '🔍' },
  { value: 'person', label: 'Pessoa', color: '#2563eb', icon: '👤' },
  { value: 'location', label: 'Local', color: '#16a34a', icon: '📍' },
  { value: 'document', label: 'Documento', color: '#ca8a04', icon: '📄' },
  { value: 'theory', label: 'Teoria', color: '#9333ea', icon: '💡' },
  { value: 'timeline', label: 'Cronologia', color: '#0891b2', icon: '⏰' },
  { value: 'unknown', label: 'Desconhecido', color: '#6b7280', icon: '❓' },
] as const;

export const STRING_COLORS = [
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#a855f7', label: 'Roxo' },
  { value: '#ffffff', label: 'Branco' },
] as const;
