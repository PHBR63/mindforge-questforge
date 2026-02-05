import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, Save, Import, ZoomIn, ZoomOut, Maximize2, Keyboard, Download } from 'lucide-react';

interface MindMapToolbarProps {
  onAddNode: () => void;
  onSaveLayout: () => void;
  onImportEntities: () => void;
  onExport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  isSaving: boolean;
  hasNodes: boolean;
}

export function MindMapToolbar({
  onAddNode,
  onSaveLayout,
  onImportEntities,
  onExport,
  onZoomIn,
  onZoomOut,
  onFitView,
  isSaving,
  hasNodes,
}: MindMapToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center border rounded-md bg-card">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8">
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Diminuir Zoom</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Aumentar Zoom</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onFitView} className="h-8 w-8">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajustar Visualização</TooltipContent>
          </Tooltip>
        </div>

        {/* Shortcuts hint */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2 border rounded-md h-8 bg-card">
              <Keyboard className="w-3 h-3" />
              <span className="hidden sm:inline">Shift+clique: multi-seleção</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p><kbd className="px-1 bg-muted rounded">Shift+Clique</kbd> - Selecionar múltiplos nós</p>
              <p><kbd className="px-1 bg-muted rounded">Delete</kbd> - Excluir nó(s) selecionado(s)</p>
              <p><kbd className="px-1 bg-muted rounded">Ctrl+D</kbd> - Duplicar nó(s) selecionado(s)</p>
              <p><kbd className="px-1 bg-muted rounded">Ctrl+C</kbd> - Copiar nó(s) selecionado(s)</p>
              <p><kbd className="px-1 bg-muted rounded">Ctrl+V</kbd> - Colar nó(s) copiado(s)</p>
              <p><kbd className="px-1 bg-muted rounded">Escape</kbd> - Desselecionar</p>
              <p><kbd className="px-1 bg-muted rounded">Clique direito</kbd> - Menu de contexto</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Action buttons */}
        <Button variant="outline" onClick={onImportEntities}>
          <Import className="w-4 h-4 mr-2" />
          Importar
        </Button>

        <Button variant="outline" onClick={onExport} disabled={!hasNodes}>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>

        <Button variant="outline" onClick={onSaveLayout} disabled={isSaving || !hasNodes}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Salvando...' : 'Salvar Layout'}
        </Button>

        <Button onClick={onAddNode} className="glow-gold">
          <Plus className="w-4 h-4 mr-2" />
          Novo Nó
        </Button>
      </div>
    </TooltipProvider>
  );
}
