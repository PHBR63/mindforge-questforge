import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Armchair, 
  TreeDeciduous, 
  Castle, 
  Sword, 
  Skull, 
  Flame,
  Mountain,
  Box,
  Gem,
  Shield,
  Zap,
  Star,
  Crown,
  BookOpen,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Preset 3D models catalog with URLs to free GLTF models
interface PresetModel {
  id: string;
  name: string;
  category: 'furniture' | 'nature' | 'structure' | 'creature' | 'item' | 'effect';
  icon: React.ReactNode;
  description: string;
  defaultScale: number;
  previewColor: string;
  // URL to a free GLTF model (using free sources)
  modelUrl?: string;
}

// NOTE: These are placeholder entries. In production, you'd link to actual GLTF files.
// For now, we'll use them as templates that create placeholder models.
const PRESET_MODELS: PresetModel[] = [
  // Furniture
  { id: 'table_round', name: 'Mesa Redonda', category: 'furniture', icon: <Armchair className="w-5 h-5" />, description: 'Uma mesa redonda de madeira', defaultScale: 1, previewColor: '#8B4513' },
  { id: 'chair_wood', name: 'Cadeira', category: 'furniture', icon: <Armchair className="w-5 h-5" />, description: 'Uma cadeira de madeira simples', defaultScale: 0.8, previewColor: '#A0522D' },
  { id: 'throne', name: 'Trono', category: 'furniture', icon: <Crown className="w-5 h-5" />, description: 'Um trono real ornamentado', defaultScale: 1.2, previewColor: '#FFD700' },
  { id: 'bookshelf', name: 'Estante', category: 'furniture', icon: <BookOpen className="w-5 h-5" />, description: 'Uma estante cheia de livros', defaultScale: 1, previewColor: '#654321' },
  { id: 'barrel', name: 'Barril', category: 'furniture', icon: <Box className="w-5 h-5" />, description: 'Um barril de madeira', defaultScale: 0.7, previewColor: '#8B4513' },
  { id: 'chest', name: 'Baú', category: 'furniture', icon: <Box className="w-5 h-5" />, description: 'Um baú do tesouro', defaultScale: 0.6, previewColor: '#CD853F' },
  
  // Nature
  { id: 'tree_oak', name: 'Carvalho', category: 'nature', icon: <TreeDeciduous className="w-5 h-5" />, description: 'Uma árvore de carvalho frondosa', defaultScale: 2, previewColor: '#228B22' },
  { id: 'tree_pine', name: 'Pinheiro', category: 'nature', icon: <TreeDeciduous className="w-5 h-5" />, description: 'Um pinheiro alto', defaultScale: 2.5, previewColor: '#006400' },
  { id: 'rock_large', name: 'Rocha Grande', category: 'nature', icon: <Mountain className="w-5 h-5" />, description: 'Uma rocha grande', defaultScale: 1.5, previewColor: '#696969' },
  { id: 'rock_pile', name: 'Pilha de Pedras', category: 'nature', icon: <Mountain className="w-5 h-5" />, description: 'Um monte de pedras', defaultScale: 1, previewColor: '#808080' },
  { id: 'bush', name: 'Arbusto', category: 'nature', icon: <TreeDeciduous className="w-5 h-5" />, description: 'Um arbusto verde', defaultScale: 0.6, previewColor: '#32CD32' },
  { id: 'mushroom', name: 'Cogumelo', category: 'nature', icon: <Star className="w-5 h-5" />, description: 'Um cogumelo mágico', defaultScale: 0.4, previewColor: '#FF6347' },
  
  // Structures
  { id: 'wall_stone', name: 'Muro de Pedra', category: 'structure', icon: <Castle className="w-5 h-5" />, description: 'Uma seção de muro de pedra', defaultScale: 1, previewColor: '#708090' },
  { id: 'pillar', name: 'Pilar', category: 'structure', icon: <Castle className="w-5 h-5" />, description: 'Um pilar de pedra ornamentado', defaultScale: 1.5, previewColor: '#B0C4DE' },
  { id: 'arch', name: 'Arco', category: 'structure', icon: <Castle className="w-5 h-5" />, description: 'Um arco de pedra', defaultScale: 1.2, previewColor: '#778899' },
  { id: 'stairs', name: 'Escada', category: 'structure', icon: <Castle className="w-5 h-5" />, description: 'Uma escada de pedra', defaultScale: 1, previewColor: '#A9A9A9' },
  { id: 'door_wooden', name: 'Porta de Madeira', category: 'structure', icon: <Box className="w-5 h-5" />, description: 'Uma porta de madeira reforçada', defaultScale: 1, previewColor: '#8B4513' },
  { id: 'bridge', name: 'Ponte', category: 'structure', icon: <Castle className="w-5 h-5" />, description: 'Uma ponte de madeira', defaultScale: 2, previewColor: '#A0522D' },
  
  // Creatures (as statues/figurines)
  { id: 'goblin', name: 'Goblin', category: 'creature', icon: <Skull className="w-5 h-5" />, description: 'Um goblin covarde', defaultScale: 0.8, previewColor: '#556B2F' },
  { id: 'orc', name: 'Orc', category: 'creature', icon: <Skull className="w-5 h-5" />, description: 'Um orc guerreiro', defaultScale: 1.2, previewColor: '#6B8E23' },
  { id: 'dragon', name: 'Dragão', category: 'creature', icon: <Flame className="w-5 h-5" />, description: 'Um dragão majestoso', defaultScale: 3, previewColor: '#DC143C' },
  { id: 'skeleton', name: 'Esqueleto', category: 'creature', icon: <Skull className="w-5 h-5" />, description: 'Um esqueleto reanimado', defaultScale: 1, previewColor: '#FFFAF0' },
  { id: 'wolf', name: 'Lobo', category: 'creature', icon: <Skull className="w-5 h-5" />, description: 'Um lobo feroz', defaultScale: 0.9, previewColor: '#696969' },
  { id: 'spider', name: 'Aranha Gigante', category: 'creature', icon: <Skull className="w-5 h-5" />, description: 'Uma aranha gigante venenosa', defaultScale: 1.5, previewColor: '#2F4F4F' },
  
  // Items
  { id: 'sword_display', name: 'Espada', category: 'item', icon: <Sword className="w-5 h-5" />, description: 'Uma espada em exibição', defaultScale: 0.5, previewColor: '#C0C0C0' },
  { id: 'shield_display', name: 'Escudo', category: 'item', icon: <Shield className="w-5 h-5" />, description: 'Um escudo em exibição', defaultScale: 0.6, previewColor: '#B8860B' },
  { id: 'gem_crystal', name: 'Cristal', category: 'item', icon: <Gem className="w-5 h-5" />, description: 'Um cristal mágico brilhante', defaultScale: 0.4, previewColor: '#E6E6FA' },
  { id: 'potion', name: 'Poção', category: 'item', icon: <Zap className="w-5 h-5" />, description: 'Uma poção mágica', defaultScale: 0.3, previewColor: '#FF69B4' },
  { id: 'scroll', name: 'Pergaminho', category: 'item', icon: <BookOpen className="w-5 h-5" />, description: 'Um pergaminho antigo', defaultScale: 0.3, previewColor: '#F5DEB3' },
  { id: 'coins', name: 'Moedas', category: 'item', icon: <Star className="w-5 h-5" />, description: 'Uma pilha de moedas de ouro', defaultScale: 0.4, previewColor: '#FFD700' },
  
  // Effects
  { id: 'campfire', name: 'Fogueira', category: 'effect', icon: <Flame className="w-5 h-5" />, description: 'Uma fogueira crepitante', defaultScale: 0.8, previewColor: '#FF4500' },
  { id: 'torch', name: 'Tocha', category: 'effect', icon: <Flame className="w-5 h-5" />, description: 'Uma tocha na parede', defaultScale: 0.5, previewColor: '#FF6347' },
  { id: 'magic_circle', name: 'Círculo Mágico', category: 'effect', icon: <Zap className="w-5 h-5" />, description: 'Um círculo mágico brilhante', defaultScale: 2, previewColor: '#9400D3' },
  { id: 'portal', name: 'Portal', category: 'effect', icon: <Zap className="w-5 h-5" />, description: 'Um portal dimensional', defaultScale: 1.5, previewColor: '#8A2BE2' },
];

const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: <Box className="w-4 h-4" /> },
  { id: 'furniture', name: 'Mobília', icon: <Armchair className="w-4 h-4" /> },
  { id: 'nature', name: 'Natureza', icon: <TreeDeciduous className="w-4 h-4" /> },
  { id: 'structure', name: 'Estruturas', icon: <Castle className="w-4 h-4" /> },
  { id: 'creature', name: 'Criaturas', icon: <Skull className="w-4 h-4" /> },
  { id: 'item', name: 'Itens', icon: <Sword className="w-4 h-4" /> },
  { id: 'effect', name: 'Efeitos', icon: <Flame className="w-4 h-4" /> },
];

interface Model3DPresetsProps {
  onSelectPreset: (preset: {
    name: string;
    scale: number;
    previewColor: string;
    presetId: string;
  }) => void;
}

export function Model3DPresets({ onSelectPreset }: Model3DPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetModel | null>(null);

  const filteredModels = PRESET_MODELS.filter((model) => {
    const matchesCategory = activeCategory === 'all' || model.category === activeCategory;
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          model.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = () => {
    if (!selectedPreset) return;

    onSelectPreset({
      name: selectedPreset.name,
      scale: selectedPreset.defaultScale,
      previewColor: selectedPreset.previewColor,
      presetId: selectedPreset.id,
    });

    setIsOpen(false);
    setSelectedPreset(null);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="gap-1"
          >
            <Star className="w-4 h-4" />
            Presets
          </Button>
        </TooltipTrigger>
        <TooltipContent>Biblioteca de Modelos Prontos</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Biblioteca de Modelos 3D
            </DialogTitle>
            <DialogDescription>
              Selecione um modelo pré-configurado para adicionar ao seu mapa
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar modelos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Categories */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-7 mb-4">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="gap-1 text-xs">
                    {cat.icon}
                    <span className="hidden sm:inline">{cat.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeCategory} className="flex-1 overflow-hidden mt-0">
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                    {filteredModels.map((model) => (
                      <div
                        key={model.id}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md',
                          selectedPreset?.id === model.id
                            ? 'border-primary bg-primary/10 shadow-md'
                            : 'border-border hover:border-primary/50'
                        )}
                        onClick={() => setSelectedPreset(model)}
                      >
                        <div
                          className="w-full aspect-square rounded-md mb-2 flex items-center justify-center"
                          style={{ backgroundColor: model.previewColor + '33' }}
                        >
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: model.previewColor }}
                          >
                            <span className="text-white">{model.icon}</span>
                          </div>
                        </div>
                        <h4 className="font-medium text-sm truncate">{model.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{model.description}</p>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Escala: {model.defaultScale}x
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredModels.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum modelo encontrado.
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={!selectedPreset}>
              Adicionar ao Mapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Export preset list for use elsewhere
export { PRESET_MODELS };
export type { PresetModel };
