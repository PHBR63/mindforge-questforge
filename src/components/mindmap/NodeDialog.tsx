import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { NODE_TYPES, NodeType } from './types';

interface NodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  nodeType: NodeType;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onNodeTypeChange: (type: NodeType) => void;
  onSubmit: () => void;
  isEditing?: boolean;
}

export function NodeDialog({
  open,
  onOpenChange,
  title,
  content,
  nodeType,
  onTitleChange,
  onContentChange,
  onNodeTypeChange,
  onSubmit,
  isEditing = false,
}: NodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Editar Nó' : 'Adicionar Nó'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do nó'
              : 'Crie um novo elemento para o mapa mental'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Nome do elemento..."
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={nodeType}
              onValueChange={(value) => onNodeTypeChange(value as NodeType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NODE_TYPES).map(([key, { label, color, icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{icon}</span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: color }}
                      />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Descrição (opcional)</Label>
            <Textarea
              id="content"
              placeholder="Detalhes adicionais..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>
            {isEditing ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
