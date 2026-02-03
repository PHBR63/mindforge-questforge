import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { CONNECTION_TYPES, ConnectionType } from './types';

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  connectionType: ConnectionType;
  onLabelChange: (label: string) => void;
  onConnectionTypeChange: (type: ConnectionType) => void;
  onSubmit: () => void;
}

export function ConnectionDialog({
  open,
  onOpenChange,
  label,
  connectionType,
  onLabelChange,
  onConnectionTypeChange,
  onSubmit,
}: ConnectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Estilizar Conexão</DialogTitle>
          <DialogDescription>
            Personalize a aparência e significado desta conexão
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="connection-label">Rótulo (opcional)</Label>
            <Input
              id="connection-label"
              placeholder="Ex: aliado, inimigo, causa..."
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="connection-type">Tipo de Conexão</Label>
            <Select
              value={connectionType}
              onValueChange={(value) => onConnectionTypeChange(value as ConnectionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_TYPES.map(({ value, label, color }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-1 rounded"
                        style={{ background: color }}
                      />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
