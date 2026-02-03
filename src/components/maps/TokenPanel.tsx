import { useState } from 'react';
import { MapToken, TOKEN_TYPES, TOKEN_SIZES } from './types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Eye, EyeOff, Layers } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TokenPanelProps {
  tokens: MapToken[];
  selectedTokenId: string | null;
  onTokenSelect: (tokenId: string | null) => void;
  onTokenCreate: (token: Omit<MapToken, 'id' | 'map_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onTokenUpdate: (tokenId: string, updates: Partial<MapToken>) => void;
  onTokenDelete: (tokenId: string) => void;
}

export function TokenPanel({
  tokens,
  selectedTokenId,
  onTokenSelect,
  onTokenCreate,
  onTokenUpdate,
  onTokenDelete,
}: TokenPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newToken, setNewToken] = useState({
    name: '',
    token_type: 'character',
    color: '#22c55e',
    size: 1,
    notes: '',
  });

  const selectedToken = tokens.find((t) => t.id === selectedTokenId);

  const handleCreateToken = () => {
    if (!newToken.name.trim()) return;

    onTokenCreate({
      name: newToken.name,
      token_type: newToken.token_type,
      color: newToken.color,
      size: newToken.size,
      position_x: 0,
      position_y: 0,
      layer: 1,
      is_visible: true,
      image_url: null,
      notes: newToken.notes || null,
    });

    setNewToken({
      name: '',
      token_type: 'character',
      color: '#22c55e',
      size: 1,
      notes: '',
    });
    setIsDialogOpen(false);
  };

  const handleTypeChange = (type: string) => {
    const tokenType = TOKEN_TYPES.find((t) => t.value === type);
    setNewToken({
      ...newToken,
      token_type: type,
      color: tokenType?.color || '#22c55e',
    });
  };

  return (
    <div className="w-72 bg-card border border-border rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Tokens
        </h3>
        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 max-h-64">
        <div className="space-y-2 pr-2">
          {tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum token criado
            </p>
          ) : (
            tokens.map((token) => (
              <div
                key={token.id}
                onClick={() => onTokenSelect(token.id)}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  selectedTokenId === token.id
                    ? 'bg-primary/20 border border-primary'
                    : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: token.color || '#ef4444' }}
                  >
                    {token.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-sm truncate">{token.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTokenUpdate(token.id, { is_visible: !token.is_visible });
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {token.is_visible ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {selectedToken && (
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-medium text-sm">Editar Token</h4>
          
          <div className="space-y-2">
            <Label className="text-xs">Nome</Label>
            <Input
              value={selectedToken.name}
              onChange={(e) => onTokenUpdate(selectedToken.id, { name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Tamanho</Label>
            <Select
              value={String(selectedToken.size || 1)}
              onValueChange={(v) => onTokenUpdate(selectedToken.id, { size: parseInt(v) })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TOKEN_SIZES.map((size) => (
                  <SelectItem key={size.value} value={String(size.value)}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Camada</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={selectedToken.layer || 1}
              onChange={(e) => onTokenUpdate(selectedToken.id, { layer: parseInt(e.target.value) })}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Visível</Label>
            <Switch
              checked={selectedToken.is_visible ?? true}
              onCheckedChange={(checked) => onTokenUpdate(selectedToken.id, { is_visible: checked })}
            />
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => {
              onTokenDelete(selectedToken.id);
              onTokenSelect(null);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remover Token
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Novo Token</DialogTitle>
            <DialogDescription>
              Adicione um novo token ao mapa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome do token..."
                value={newToken.name}
                onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={newToken.token_type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamanho</Label>
              <Select
                value={String(newToken.size)}
                onValueChange={(v) => setNewToken({ ...newToken, size: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_SIZES.map((size) => (
                    <SelectItem key={size.value} value={String(size.value)}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Anotações sobre o token..."
                value={newToken.notes}
                onChange={(e) => setNewToken({ ...newToken, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateToken}>Criar Token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
