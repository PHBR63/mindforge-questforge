import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { Upload, FileJson, AlertCircle, CheckCircle2, Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  detectImportFormat,
  parseLDtkFile,
  getLDtkLevels,
  parseLDtkLevel,
  parseUVTTFile,
  SUPPORTED_IMPORT_ACCEPT,
  type ImportFormat,
  type LDtkImportResult,
  type UVTTImportResult,
} from './importExport';
import { MapData, MapToken } from './types';
import { MapAsset } from './assetTypes';
import { MapDrawing } from './drawingTypes';
import { type PlacedTile } from './tilesets';

interface MapImportProps {
  onImport: (data: {
    mapData: {
      name: string;
      gridWidth: number;
      gridHeight: number;
      cellSize: number;
      backgroundColor: string;
      backgroundImageUrl?: string;
    };
    tokens: Partial<MapToken>[];
    assets: Partial<MapAsset>[];
    drawings: Partial<MapDrawing>[];
    tiles?: Partial<PlacedTile>[];
    walls?: any[];
    portals?: any[];
    lights?: any[];
  }) => Promise<void>;
  disabled?: boolean;
}

type ImportStep = 'select' | 'preview' | 'importing' | 'done' | 'error';

interface ImportPreview {
  format: ImportFormat;
  filename: string;
  mapData?: {
    name: string;
    gridWidth: number;
    gridHeight: number;
    cellSize: number;
    backgroundColor: string;
    backgroundImageBase64?: string;
  };
  tokens: Partial<MapToken>[];
  assets: Partial<MapAsset>[];
  drawings: Partial<MapDrawing>[];
  tiles?: Partial<PlacedTile>[];
  walls?: any[];
  portals?: any[];
  lights?: any[];
  ldtkLevels?: { id: number; name: string }[];
  selectedLevelId?: number;
  rawContent?: string;
}

export function MapImport({ onImport, disabled }: MapImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ImportStep>('select');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const resetState = useCallback(() => {
    setStep('select');
    setPreview(null);
    setError(null);
    setProgress(0);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setProgress(10);
      const content = await file.text();
      setProgress(30);

      const format = detectImportFormat(file.name, content);
      
      if (format === 'unknown') {
        setError('Formato de arquivo não suportado. Use arquivos .ldtk, .uvtt ou .json');
        setStep('error');
        return;
      }

      setProgress(50);

      let importResult: LDtkImportResult | UVTTImportResult;
      let ldtkLevels: { id: number; name: string }[] | undefined;

      if (format === 'ldtk') {
        ldtkLevels = getLDtkLevels(content);
        importResult = parseLDtkFile(content);
      } else if (format === 'uvtt') {
        importResult = parseUVTTFile(content, file.name);
      } else {
        // Parse our own JSON format
        try {
          const jsonData = JSON.parse(content);
          
          // Parse tiles from JSON format
          const tiles = (jsonData.tiles || []).map((t: any) => ({
            tileId: t.tileId,
            x: t.x,
            y: t.y,
            rotation: t.rotation || 0,
            scale: t.scale || 1,
            isVisible: t.isVisible !== false,
          }));
          
          importResult = {
            success: true,
            mapData: {
              name: jsonData.map?.name || 'Imported Map',
              gridWidth: jsonData.map?.gridWidth || 20,
              gridHeight: jsonData.map?.gridHeight || 15,
              cellSize: jsonData.map?.cellSize || 40,
              backgroundColor: jsonData.map?.backgroundColor || '#1a1a2e',
            },
            tokens: jsonData.tokens || [],
            assets: jsonData.assets || [],
            drawings: jsonData.drawings || [],
            tiles,
          } as LDtkImportResult & { tiles: any[] };
        } catch {
          setError('Erro ao processar arquivo JSON');
          setStep('error');
          return;
        }
      }

      setProgress(80);

      if (!importResult.success) {
        setError(importResult.error || 'Erro desconhecido ao importar');
        setStep('error');
        return;
      }

      setPreview({
        format,
        filename: file.name,
        mapData: importResult.mapData,
        tokens: importResult.tokens,
        assets: 'assets' in importResult ? importResult.assets : [],
        drawings: importResult.drawings,
        tiles: 'tiles' in importResult ? (importResult as any).tiles : undefined,
        walls: 'walls' in importResult ? importResult.walls : undefined,
        portals: 'portals' in importResult ? importResult.portals : undefined,
        lights: 'lights' in importResult ? importResult.lights : undefined,
        ldtkLevels,
        rawContent: content,
      });

      setProgress(100);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ler arquivo');
      setStep('error');
    }
  };

  const handleLevelChange = (levelId: string) => {
    if (!preview?.rawContent) return;

    const result = parseLDtkLevel(preview.rawContent, parseInt(levelId));
    if (result.success) {
      setPreview({
        ...preview,
        selectedLevelId: parseInt(levelId),
        mapData: result.mapData,
        tokens: result.tokens,
        assets: result.assets,
        drawings: result.drawings,
      });
    }
  };

  const handleImport = async () => {
    if (!preview?.mapData) return;

    setStep('importing');
    setProgress(0);

    try {
      // Convert base64 image to URL if present
      let backgroundImageUrl: string | undefined;
      if (preview.mapData.backgroundImageBase64) {
        backgroundImageUrl = `data:image/png;base64,${preview.mapData.backgroundImageBase64}`;
      }

      setProgress(50);

      await onImport({
        mapData: {
          name: preview.mapData.name,
          gridWidth: preview.mapData.gridWidth,
          gridHeight: preview.mapData.gridHeight,
          cellSize: preview.mapData.cellSize,
          backgroundColor: preview.mapData.backgroundColor,
          backgroundImageUrl,
        },
        tokens: preview.tokens,
        assets: preview.assets,
        drawings: preview.drawings,
        tiles: preview.tiles,
        walls: preview.walls,
        portals: preview.portals,
        lights: preview.lights,
      });

      setProgress(100);
      setStep('done');

      toast({
        title: 'Mapa importado!',
        description: `${preview.mapData.name} foi importado com sucesso.`,
      });

      setTimeout(() => {
        setIsOpen(false);
        resetState();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar mapa');
      setStep('error');
    }
  };

  const getFormatLabel = (format: ImportFormat) => {
    switch (format) {
      case 'ldtk':
        return 'LDtk Level Designer';
      case 'uvtt':
        return 'Universal VTT';
      case 'json':
        return 'JSON';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetState();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
          <Upload className="w-4 h-4" />
          Importar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Map className="w-5 h-5" />
            Importar Mapa
          </DialogTitle>
          <DialogDescription>
            Importe mapas de LDtk, Universal VTT ou JSON
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step: Select File */}
          {step === 'select' && (
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept={SUPPORTED_IMPORT_ACCEPT}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Clique para selecionar ou arraste um arquivo
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Formatos suportados: .ldtk, .uvtt, .dd2vtt, .json
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-muted/50 rounded">
                  <FileJson className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                  <span>LDtk</span>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <FileJson className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                  <span>Universal VTT</span>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <FileJson className="w-6 h-6 mx-auto mb-1 text-green-500" />
                  <span>JSON</span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Arquivo válido: {getFormatLabel(preview.format)}
              </div>

              {/* LDtk Level Selector */}
              {preview.ldtkLevels && preview.ldtkLevels.length > 1 && (
                <div className="space-y-2">
                  <Label>Selecionar Nível</Label>
                  <Select
                    value={preview.selectedLevelId?.toString() || preview.ldtkLevels[0].id.toString()}
                    onValueChange={handleLevelChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {preview.ldtkLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Map Preview Info */}
              {preview.mapData && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">{preview.mapData.name}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>Tamanho: {preview.mapData.gridWidth}x{preview.mapData.gridHeight}</div>
                    <div>Célula: {preview.mapData.cellSize}px</div>
                    <div>Tokens: {preview.tokens.length}</div>
                    <div>Assets: {preview.assets.length}</div>
                    <div>Desenhos: {preview.drawings.length}</div>
                    {preview.tiles && preview.tiles.length > 0 && <div>Tiles: {preview.tiles.length}</div>}
                    {preview.walls && <div>Paredes: {preview.walls.length}</div>}
                    {preview.lights && <div>Luzes: {preview.lights.length}</div>}
                    {preview.portals && <div>Portas: {preview.portals.length}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="space-y-4 py-4">
              <div className="text-center text-sm text-muted-foreground">
                Importando mapa...
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="flex flex-col items-center py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-sm text-muted-foreground">
                Mapa importado com sucesso!
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-4">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-sm text-destructive text-center">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={resetState}
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </div>

        {step === 'preview' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsOpen(false);
              resetState();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleImport} className="gap-2">
              <Upload className="w-4 h-4" />
              Importar Mapa
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
