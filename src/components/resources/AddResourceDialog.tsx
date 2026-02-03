import { useState } from 'react';
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
import { Image, FileText, Music, Video } from 'lucide-react';
import { resourceTypes } from './types';

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description: string;
    type: string;
    file_url: string;
    tags: string;
  }) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  FileText,
  Music,
  Video,
};

export function AddResourceDialog({ open, onOpenChange, onSubmit }: AddResourceDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'image',
    file_url: '',
    tags: '',
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSubmit(formData);
    setFormData({ name: '', description: '', type: 'image', file_url: '', tags: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar Recurso</DialogTitle>
          <DialogDescription>
            Salve imagens, documentos e outros recursos na biblioteca
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              placeholder="Nome do recurso"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
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
            <Label>URL do Arquivo</Label>
            <Input
              placeholder="https://..."
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
