import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InvestigationClue, CLUE_TYPES, STRING_COLORS } from './types';
import { Plus, Trash2, Link, X } from 'lucide-react';

interface CluePanelProps {
  clues: InvestigationClue[];
  selectedClueId: string | null;
  onClueCreate: (clue: Omit<InvestigationClue, 'id' | 'board_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onClueUpdate: (id: string, updates: Partial<InvestigationClue>) => void;
  onClueDelete: (id: string) => void;
  onClueSelect: (id: string | null) => void;
  onStartConnection: () => void;
  isConnecting: boolean;
}

export function CluePanel({
  clues,
  selectedClueId,
  onClueCreate,
  onClueUpdate,
  onClueDelete,
  onClueSelect,
  onStartConnection,
  isConnecting,
}: CluePanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newClue, setNewClue] = useState({
    title: '',
    content: '',
    clue_type: 'evidence',
    color: '#dc2626',
  });

  const selectedClue = clues.find(c => c.id === selectedClueId);

  const handleCreate = () => {
    if (!newClue.title.trim()) return;
    
    onClueCreate({
      title: newClue.title,
      content: newClue.content || null,
      clue_type: newClue.clue_type,
      color: newClue.color,
      image_url: null,
      position_x: 100 + Math.random() * 200,
      position_y: 100 + Math.random() * 200,
      is_pinned: true,
    });
    
    setNewClue({ title: '', content: '', clue_type: 'evidence', color: '#dc2626' });
    setIsCreating(false);
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-display text-lg font-bold mb-2">Pistas</h3>
        <Button 
          onClick={() => setIsCreating(true)} 
          className="w-full"
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Pista
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Create new clue form */}
          {isCreating && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">Nova Pista</Label>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsCreating(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={newClue.title}
                  onChange={(e) => setNewClue({ ...newClue, title: e.target.value })}
                  placeholder="Nome da pista"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newClue.clue_type}
                  onValueChange={(v) => {
                    const type = CLUE_TYPES.find(t => t.value === v);
                    setNewClue({ 
                      ...newClue, 
                      clue_type: v,
                      color: type?.color || '#dc2626'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLUE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={newClue.content}
                  onChange={(e) => setNewClue({ ...newClue, content: e.target.value })}
                  placeholder="Detalhes da pista..."
                  rows={3}
                />
              </div>

              <Button onClick={handleCreate} className="w-full">
                Adicionar Pista
              </Button>
            </div>
          )}

          {/* Selected clue editor */}
          {selectedClue && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <Label className="font-semibold">Editar Pista</Label>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onClueSelect(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={selectedClue.title}
                  onChange={(e) => onClueUpdate(selectedClue.id, { title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={selectedClue.clue_type || 'evidence'}
                  onValueChange={(v) => {
                    const type = CLUE_TYPES.find(t => t.value === v);
                    onClueUpdate(selectedClue.id, { 
                      clue_type: v,
                      color: type?.color
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLUE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={selectedClue.content || ''}
                  onChange={(e) => onClueUpdate(selectedClue.id, { content: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onStartConnection}
                  disabled={isConnecting}
                >
                  <Link className="w-4 h-4 mr-2" />
                  {isConnecting ? 'Conectando...' : 'Conectar'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => {
                    onClueDelete(selectedClue.id);
                    onClueSelect(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Clue list */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Todas as Pistas ({clues.length})
            </Label>
            {clues.map((clue) => {
              const type = CLUE_TYPES.find(t => t.value === clue.clue_type) || CLUE_TYPES[0];
              return (
                <div
                  key={clue.id}
                  onClick={() => onClueSelect(clue.id)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-colors
                    border-l-4
                    ${selectedClueId === clue.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-background hover:bg-muted border-transparent'
                    }
                  `}
                  style={{ borderLeftColor: clue.color || type.color }}
                >
                  <div className="flex items-center gap-2">
                    <span>{type.icon}</span>
                    <span className="font-medium text-sm truncate">{clue.title}</span>
                  </div>
                  {clue.content && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {clue.content}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
