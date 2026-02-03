import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Building,
  Image,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapFloor } from './wallTypes';

interface FloorPanelProps {
  floors: MapFloor[];
  activeFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
  onFloorCreate: (name: string, floorNumber: number) => Promise<void>;
  onFloorUpdate: (floorId: string, updates: Partial<MapFloor>) => void;
  onFloorDelete: (floorId: string) => void;
  onFloorPlanUpload: (floorId: string, file: File) => Promise<void>;
}

export function FloorPanel({
  floors,
  activeFloorId,
  onFloorSelect,
  onFloorCreate,
  onFloorUpdate,
  onFloorDelete,
  onFloorPlanUpload,
}: FloorPanelProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorNumber, setNewFloorNumber] = useState(0);
  const [expandedFloorId, setExpandedFloorId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFloorId, setUploadingFloorId] = useState<string | null>(null);

  const sortedFloors = [...floors].sort((a, b) => b.floor_number - a.floor_number);

  const handleCreate = async () => {
    if (!newFloorName.trim()) return;
    await onFloorCreate(newFloorName, newFloorNumber);
    setNewFloorName('');
    setNewFloorNumber(Math.max(...floors.map((f) => f.floor_number), 0) + 1);
    setIsCreateOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingFloorId) return;

    await onFloorPlanUpload(uploadingFloorId, file);
    setUploadingFloorId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (floorId: string) => {
    setUploadingFloorId(floorId);
    fileInputRef.current?.click();
  };

  const getFloorLabel = (floorNumber: number): string => {
    if (floorNumber === 0) return 'Térreo';
    if (floorNumber < 0) return `Subsolo ${Math.abs(floorNumber)}`;
    return `${floorNumber}º Andar`;
  };

  return (
    <div className="w-72 bg-card rounded-lg border border-border p-3 flex flex-col max-h-[400px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Andares</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setNewFloorNumber(Math.max(...floors.map((f) => f.floor_number), 0) + 1);
            setIsCreateOpen(true);
          }}
          className="h-7 px-2"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {sortedFloors.map((floor) => (
            <Collapsible
              key={floor.id}
              open={expandedFloorId === floor.id}
              onOpenChange={(open) => setExpandedFloorId(open ? floor.id : null)}
            >
              <div
                className={cn(
                  'rounded-md border transition-colors',
                  activeFloorId === floor.id
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-muted/50'
                )}
              >
                <div className="flex items-center gap-2 p-2">
                  <button
                    className="flex-1 text-left"
                    onClick={() => onFloorSelect(floor.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
                        {getFloorLabel(floor.floor_number)}
                      </span>
                      <span className="text-sm truncate">{floor.name}</span>
                    </div>
                  </button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() =>
                      onFloorUpdate(floor.id, { is_visible: !floor.is_visible })
                    }
                  >
                    {floor.is_visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>

                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {expandedFloorId === floor.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="px-2 pb-2 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Altura do andar: {floor.height}m</Label>
                      <Slider
                        value={[floor.height]}
                        onValueChange={([v]) => onFloorUpdate(floor.id, { height: v })}
                        min={2}
                        max={10}
                        step={0.5}
                      />
                    </div>

                    {/* Floor plan settings */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          Planta Baixa
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => triggerUpload(floor.id)}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </Button>
                      </div>

                      {floor.floor_plan_url && (
                        <div className="space-y-2">
                          <div className="aspect-video rounded overflow-hidden bg-muted">
                            <img
                              src={floor.floor_plan_url}
                              alt="Floor plan"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Opacidade: {Math.round(floor.floor_plan_opacity * 100)}%
                            </Label>
                            <Slider
                              value={[floor.floor_plan_opacity]}
                              onValueChange={([v]) =>
                                onFloorUpdate(floor.id, { floor_plan_opacity: v })
                              }
                              min={0.1}
                              max={1}
                              step={0.05}
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Escala: {floor.floor_plan_scale.toFixed(2)}x
                            </Label>
                            <Slider
                              value={[floor.floor_plan_scale]}
                              onValueChange={([v]) =>
                                onFloorUpdate(floor.id, { floor_plan_scale: v })
                              }
                              min={0.1}
                              max={3}
                              step={0.05}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => onFloorDelete(floor.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Excluir Andar
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {floors.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum andar criado.
            <br />
            Clique em + para adicionar.
          </div>
        )}
      </ScrollArea>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Novo Andar</DialogTitle>
            <DialogDescription>
              Adicione um novo andar ao mapa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Andar</Label>
              <Input
                placeholder="Ex: Salão Principal"
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Número do Andar</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewFloorNumber(newFloorNumber - 1)}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewFloorNumber(newFloorNumber + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {getFloorLabel(newFloorNumber)}
                {newFloorNumber < 0 && ' (subterrâneo)'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Andar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
