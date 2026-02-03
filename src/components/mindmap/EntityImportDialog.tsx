import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Users, MapPin, Swords, Loader2 } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  description?: string | null;
}

interface EntityImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onImport: (entities: { type: 'npc' | 'location' | 'quest'; items: Entity[] }[]) => void;
}

export function EntityImportDialog({
  open,
  onOpenChange,
  campaignId,
  onImport,
}: EntityImportDialogProps) {
  const [npcs, setNpcs] = useState<Entity[]>([]);
  const [locations, setLocations] = useState<Entity[]>([]);
  const [quests, setQuests] = useState<Entity[]>([]);
  const [selectedNpcs, setSelectedNpcs] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && campaignId) {
      loadEntities();
    }
  }, [open, campaignId]);

  const loadEntities = async () => {
    setLoading(true);
    try {
      const [npcsRes, locationsRes, questsRes] = await Promise.all([
        supabase
          .from('npcs')
          .select('id, name, description')
          .eq('campaign_id', campaignId),
        supabase
          .from('locations')
          .select('id, name, description')
          .eq('campaign_id', campaignId),
        supabase
          .from('quests')
          .select('id, title, description')
          .eq('campaign_id', campaignId),
      ]);

      if (npcsRes.data) setNpcs(npcsRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
      if (questsRes.data)
        setQuests(questsRes.data.map((q) => ({ id: q.id, name: q.title, description: q.description })));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    const imports: { type: 'npc' | 'location' | 'quest'; items: Entity[] }[] = [];

    if (selectedNpcs.length > 0) {
      imports.push({
        type: 'npc',
        items: npcs.filter((n) => selectedNpcs.includes(n.id)),
      });
    }
    if (selectedLocations.length > 0) {
      imports.push({
        type: 'location',
        items: locations.filter((l) => selectedLocations.includes(l.id)),
      });
    }
    if (selectedQuests.length > 0) {
      imports.push({
        type: 'quest',
        items: quests.filter((q) => selectedQuests.includes(q.id)),
      });
    }

    onImport(imports);
    setSelectedNpcs([]);
    setSelectedLocations([]);
    setSelectedQuests([]);
    onOpenChange(false);
  };

  const toggleSelection = (
    id: string,
    selected: string[],
    setSelected: (ids: string[]) => void
  ) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const totalSelected =
    selectedNpcs.length + selectedLocations.length + selectedQuests.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Importar Entidades</DialogTitle>
          <DialogDescription>
            Selecione NPCs, Locais e Missões para adicionar como nós ao mapa mental
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="npcs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="npcs" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                NPCs ({npcs.length})
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locais ({locations.length})
              </TabsTrigger>
              <TabsTrigger value="quests" className="flex items-center gap-2">
                <Swords className="w-4 h-4" />
                Missões ({quests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="npcs">
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {npcs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum NPC encontrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {npcs.map((npc) => (
                      <div key={npc.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`npc-${npc.id}`}
                          checked={selectedNpcs.includes(npc.id)}
                          onCheckedChange={() =>
                            toggleSelection(npc.id, selectedNpcs, setSelectedNpcs)
                          }
                        />
                        <Label
                          htmlFor={`npc-${npc.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{npc.name}</div>
                          {npc.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {npc.description}
                            </p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="locations">
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {locations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum local encontrado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={selectedLocations.includes(location.id)}
                          onCheckedChange={() =>
                            toggleSelection(
                              location.id,
                              selectedLocations,
                              setSelectedLocations
                            )
                          }
                        />
                        <Label
                          htmlFor={`location-${location.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{location.name}</div>
                          {location.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {location.description}
                            </p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="quests">
              <ScrollArea className="h-[300px] border rounded-md p-4">
                {quests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma missão encontrada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {quests.map((quest) => (
                      <div key={quest.id} className="flex items-start gap-3">
                        <Checkbox
                          id={`quest-${quest.id}`}
                          checked={selectedQuests.includes(quest.id)}
                          onCheckedChange={() =>
                            toggleSelection(
                              quest.id,
                              selectedQuests,
                              setSelectedQuests
                            )
                          }
                        />
                        <Label
                          htmlFor={`quest-${quest.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium">{quest.name}</div>
                          {quest.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {quest.description}
                            </p>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={totalSelected === 0}>
            Importar {totalSelected > 0 && `(${totalSelected})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
