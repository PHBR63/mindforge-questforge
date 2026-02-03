import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileImage, FileJson, FileText, FileBox } from 'lucide-react';
import { MapData, MapToken } from './types';
import { MapAsset } from './assetTypes';
import { MapDrawing, MapLayer } from './drawingTypes';
import { exportToUVTT } from './importExport';
import { type PlacedTile } from './tilesets';

interface MapExportProps {
  map: MapData;
  tokens: MapToken[];
  assets: MapAsset[];
  drawings: MapDrawing[];
  layers: MapLayer[];
  tiles?: PlacedTile[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  walls?: Array<{
    start_x: number;
    start_y: number;
    end_x: number;
    end_y: number;
  }>;
  lights?: Array<{
    position_x: number;
    position_y: number;
    range: number;
    intensity: number;
    color: string;
    cast_shadows: boolean;
  }>;
  portals?: Array<{
    position_x: number;
    position_y: number;
    width: number;
    isOpen: boolean;
    portalType: string;
  }>;
}

type ExportFormat = 'png' | 'jpg' | 'json' | 'uvtt';

interface ExportOptions {
  format: ExportFormat;
  includeGrid: boolean;
  includeTokens: boolean;
  includeAssets: boolean;
  includeDrawings: boolean;
  includeTiles: boolean;
  includeWalls: boolean;
  includeLights: boolean;
  quality: number;
  filename: string;
}

export function MapExport({
  map,
  tokens,
  assets,
  drawings,
  layers,
  tiles = [],
  canvasRef,
  walls = [],
  lights = [],
  portals = [],
}: MapExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'png',
    includeGrid: true,
    includeTokens: true,
    includeAssets: true,
    includeDrawings: true,
    includeTiles: true,
    includeWalls: true,
    includeLights: true,
    quality: 90,
    filename: map.name.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (options.format === 'json') {
        exportAsJSON();
      } else if (options.format === 'uvtt') {
        exportAsUVTT();
      } else {
        await exportAsImage();
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const exportAsJSON = () => {
    const exportData = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      map: {
        name: map.name,
        description: map.description,
        gridWidth: map.grid_width,
        gridHeight: map.grid_height,
        cellSize: map.cell_size,
        backgroundColor: map.background_color,
        backgroundImageUrl: map.background_image_url,
      },
      tokens: options.includeTokens
        ? tokens.map((t) => ({
            name: t.name,
            type: t.token_type,
            color: t.color,
            size: t.size,
            positionX: t.position_x,
            positionY: t.position_y,
            layer: t.layer,
            isVisible: t.is_visible,
            notes: t.notes,
          }))
        : [],
      assets: options.includeAssets
        ? assets.map((a) => ({
            assetKey: a.asset_key,
            assetType: a.asset_type,
            positionX: a.position_x,
            positionY: a.position_y,
            rotation: a.rotation,
            scale: a.scale,
            layer: a.layer,
            isVisible: a.is_visible,
            customImageUrl: a.custom_image_url,
            name: a.name,
          }))
        : [],
      drawings: options.includeDrawings
        ? drawings.map((d) => ({
            toolType: d.tool_type,
            color: d.color,
            brushSize: d.brush_size,
            opacity: d.opacity,
            points: d.points,
            layer: d.layer,
          }))
        : [],
      tiles: options.includeTiles
        ? tiles.map((t) => ({
            tileId: t.tileId,
            x: t.x,
            y: t.y,
            rotation: t.rotation,
            scale: t.scale,
            isVisible: t.isVisible,
          }))
        : [],
      layers: layers.map((l) => ({
        name: l.name,
        layerType: l.layer_type,
        layerOrder: l.layer_order,
        isVisible: l.is_visible,
        isLocked: l.is_locked,
        opacity: l.opacity,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${options.filename}.json`);
  };

  const exportAsUVTT = () => {
    const uvttContent = exportToUVTT({
      mapName: map.name,
      gridWidth: map.grid_width,
      gridHeight: map.grid_height,
      cellSize: map.cell_size,
      walls: options.includeWalls ? walls : [],
      lights: options.includeLights ? lights : undefined,
      portals: portals.length > 0 ? portals : undefined,
      pixelsPerGrid: 140,
    });

    const blob = new Blob([uvttContent], {
      type: 'application/json',
    });
    downloadBlob(blob, `${options.filename}.uvtt`);
  };

  const exportAsImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw the current canvas content
    ctx.drawImage(canvas, 0, 0);

    // Convert to blob and download
    const mimeType = options.format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = options.format === 'jpg' ? options.quality / 100 : undefined;

    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          downloadBlob(blob, `${options.filename}.${options.format}`);
        }
      },
      mimeType,
      quality
    );
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'png':
      case 'jpg':
        return <FileImage className="w-4 h-4" />;
      case 'json':
        return <FileJson className="w-4 h-4" />;
      case 'uvtt':
        return <FileBox className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Exportar Mapa</DialogTitle>
          <DialogDescription>
            Escolha o formato e as opções de exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Filename */}
          <div className="space-y-2">
            <Label>Nome do Arquivo</Label>
            <Input
              value={options.filename}
              onChange={(e) =>
                setOptions({ ...options, filename: e.target.value })
              }
              placeholder="nome_do_mapa"
            />
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select
              value={options.format}
              onValueChange={(v) =>
                setOptions({ ...options, format: v as ExportFormat })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    PNG (Sem perda de qualidade)
                  </div>
                </SelectItem>
                <SelectItem value="jpg">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" />
                    JPG (Tamanho menor)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    JSON (Para importação)
                  </div>
                </SelectItem>
                <SelectItem value="uvtt">
                  <div className="flex items-center gap-2">
                    <FileBox className="w-4 h-4" />
                    Universal VTT (Roll20, Foundry)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image quality (only for JPG) */}
          {options.format === 'jpg' && (
            <div className="space-y-2">
              <Label>Qualidade: {options.quality}%</Label>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={options.quality}
                onChange={(e) =>
                  setOptions({ ...options, quality: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          )}

          {/* Include options */}
          <div className="space-y-3">
            <Label>Incluir no Export</Label>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeGrid"
                checked={options.includeGrid}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeGrid: checked as boolean })
                }
              />
              <Label htmlFor="includeGrid" className="font-normal cursor-pointer">
                Grid
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeTokens"
                checked={options.includeTokens}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTokens: checked as boolean })
                }
              />
              <Label htmlFor="includeTokens" className="font-normal cursor-pointer">
                Tokens
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeAssets"
                checked={options.includeAssets}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeAssets: checked as boolean })
                }
              />
              <Label htmlFor="includeAssets" className="font-normal cursor-pointer">
                Assets
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeDrawings"
                checked={options.includeDrawings}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeDrawings: checked as boolean })
                }
              />
              <Label htmlFor="includeDrawings" className="font-normal cursor-pointer">
                Desenhos
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="includeTiles"
                checked={options.includeTiles}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeTiles: checked as boolean })
                }
              />
              <Label htmlFor="includeTiles" className="font-normal cursor-pointer">
                Tiles
              </Label>
            </div>

            {options.format === 'uvtt' && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeWalls"
                    checked={options.includeWalls}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeWalls: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeWalls" className="font-normal cursor-pointer">
                    Paredes (Line of Sight)
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="includeLights"
                    checked={options.includeLights}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeLights: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeLights" className="font-normal cursor-pointer">
                    Luzes
                  </Label>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {getFormatIcon(options.format)}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
