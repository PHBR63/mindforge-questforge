import { useState } from 'react';
import { useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, Image, FileJson, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MindMapNodeData, MindMapConnection } from './types';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignName: string;
  nodeDataMap: Map<string, MindMapNodeData>;
  connections: { id: string; source: string; target: string; label?: string; connectionType?: string }[];
}

const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;

export function ExportDialog({
  open,
  onOpenChange,
  campaignName,
  nodeDataMap,
  connections,
}: ExportDialogProps) {
  const { toast } = useToast();
  const { getNodes, getEdges } = useReactFlow();
  const [exportFormat, setExportFormat] = useState<'png' | 'json'>('png');
  const [fileName, setFileName] = useState(campaignName.replace(/\s+/g, '_').toLowerCase());
  const [isExporting, setIsExporting] = useState(false);
  const [imageScale, setImageScale] = useState('2');

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportFormat === 'png') {
        await exportAsPng();
      } else {
        exportAsJson();
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: 'Não foi possível exportar o mapa mental.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPng = async () => {
    const nodes = getNodes();
    if (nodes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Mapa vazio',
        description: 'Adicione nós ao mapa antes de exportar.',
      });
      return;
    }

    // Get the ReactFlow viewport element
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      throw new Error('Viewport not found');
    }

    const nodesBounds = getNodesBounds(nodes);
    const scale = parseFloat(imageScale);
    const padding = 50;

    // Calculate dimensions based on content
    const width = Math.max(nodesBounds.width + padding * 2, IMAGE_WIDTH);
    const height = Math.max(nodesBounds.height + padding * 2, IMAGE_HEIGHT);

    const transform = getViewportForBounds(
      nodesBounds,
      width,
      height,
      0.5,
      2,
      padding
    );

    const dataUrl = await toPng(viewport, {
      backgroundColor: '#1a1a2e',
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      pixelRatio: scale,
    });

    // Download the image
    const link = document.createElement('a');
    link.download = `${fileName}_mindmap.png`;
    link.href = dataUrl;
    link.click();

    toast({
      title: 'Exportado com sucesso!',
      description: `Mapa mental salvo como ${fileName}_mindmap.png`,
    });
  };

  const exportAsJson = () => {
    const nodes = getNodes();
    const edges = getEdges();

    if (nodes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Mapa vazio',
        description: 'Adicione nós ao mapa antes de exportar.',
      });
      return;
    }

    // Build export data with full node information
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      campaign: campaignName,
      nodes: nodes.map((node) => {
        const nodeData = nodeDataMap.get(node.id);
        return {
          id: node.id,
          title: nodeData?.title || '',
          content: nodeData?.content || null,
          nodeType: nodeData?.node_type || 'idea',
          color: nodeData?.color || null,
          entityId: nodeData?.entity_id || null,
          entityType: nodeData?.entity_type || null,
          position: {
            x: node.position.x,
            y: node.position.y,
          },
        };
      }),
      connections: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: (edge.data as any)?.label || null,
        connectionType: (edge.data as any)?.connectionType || 'default',
      })),
      metadata: {
        totalNodes: nodes.length,
        totalConnections: edges.length,
        nodeTypes: [...new Set(Array.from(nodeDataMap.values()).map((n) => n.node_type))],
      },
    };

    // Download as JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${fileName}_mindmap.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportado com sucesso!',
      description: `Mapa mental salvo como ${fileName}_mindmap.json`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Mapa Mental
          </DialogTitle>
          <DialogDescription>
            Escolha o formato e as opções de exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File name */}
          <div className="space-y-2">
            <Label htmlFor="filename">Nome do arquivo</Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="nome_do_arquivo"
            />
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <Label>Formato</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('png')}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${exportFormat === 'png'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <Image className="w-8 h-8 text-primary" />
                <span className="font-medium">PNG</span>
                <span className="text-xs text-muted-foreground">Imagem</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`
                  flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                  ${exportFormat === 'json'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <FileJson className="w-8 h-8 text-blue-500" />
                <span className="font-medium">JSON</span>
                <span className="text-xs text-muted-foreground">Dados</span>
              </button>
            </div>
          </div>

          {/* PNG-specific options */}
          {exportFormat === 'png' && (
            <div className="space-y-2">
              <Label>Escala da imagem</Label>
              <Select value={imageScale} onValueChange={setImageScale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x (Padrão)</SelectItem>
                  <SelectItem value="2">2x (Alta qualidade)</SelectItem>
                  <SelectItem value="3">3x (Ultra HD)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Escalas maiores resultam em imagens de maior resolução
              </p>
            </div>
          )}

          {/* JSON info */}
          {exportFormat === 'json' && (
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                O arquivo JSON inclui todos os nós, conexões, posições e metadados do mapa mental.
                Ideal para backup ou importação futura.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !fileName.trim()}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
