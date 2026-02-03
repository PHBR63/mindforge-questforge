import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MapToken, TokenDragState } from './types';
import { MapAsset, getAssetByKey } from './assetTypes';
import { MapDrawing, DrawingState, DrawingTool, DrawingPoint } from './drawingTypes';
import { Map3DModel } from './model3DTypes';
import { Model3DOverlay } from './Model3DPlaceholder';
import { type PlacedTile, getTileById } from './tilesets';

interface DrawableMapGridProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  backgroundColor: string;
  tokens: MapToken[];
  assets?: MapAsset[];
  drawings?: MapDrawing[];
  selectedTokenId: string | null;
  selectedAssetId?: string | null;
  models3D?: Map3DModel[];
  selectedModel3DId?: string | null;
  drawingState: DrawingState;
  onTokenMove: (tokenId: string, x: number, y: number) => void;
  onTokenSelect: (tokenId: string | null) => void;
  onAssetSelect?: (assetId: string | null) => void;
  onAssetMove?: (assetId: string, x: number, y: number) => void;
  onModel3DSelect?: (modelId: string | null) => void;
  onModel3DMove?: (modelId: string, x: number, y: number) => void;
  onCellClick: (x: number, y: number) => void;
  onAssetDrop?: (assetKey: string, category: string, x: number, y: number, customImageUrl?: string, name?: string) => void;
  onDrawingComplete?: (drawing: Omit<MapDrawing, 'id' | 'map_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onFloodFill?: (x: number, y: number, color: string) => void;
  onSwitchTo3D?: () => void;
  // Tileset props
  placedTiles?: PlacedTile[];
  selectedTileInstanceId?: string | null;
  onTileSelect?: (id: string | null) => void;
  onTileMove?: (id: string, x: number, y: number) => void;
  onTileDrop?: (tileId: string, x: number, y: number) => void;
}

export interface DrawableMapGridRef {
  getCanvas: () => HTMLCanvasElement | null;
}

export const DrawableMapGrid = forwardRef<DrawableMapGridRef, DrawableMapGridProps>(function DrawableMapGrid({
  gridWidth,
  gridHeight,
  cellSize,
  backgroundColor,
  tokens,
  assets = [],
  drawings = [],
  selectedTokenId,
  selectedAssetId,
  models3D = [],
  selectedModel3DId,
  drawingState,
  onTokenMove,
  onTokenSelect,
  onAssetSelect,
  onAssetMove,
  onModel3DSelect,
  onModel3DMove,
  onCellClick,
  onAssetDrop,
  onDrawingComplete,
  onFloodFill,
  onSwitchTo3D,
  placedTiles = [],
  selectedTileInstanceId,
  onTileSelect,
  onTileMove,
  onTileDrop,
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<TokenDragState>({
    isDragging: false,
    tokenId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);
  const [shapeStart, setShapeStart] = useState<DrawingPoint | null>(null);
  const [tileImages, setTileImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [assetImages, setAssetImages] = useState<Map<string, HTMLImageElement>>(new Map());

  // Preload tile images
  useEffect(() => {
    const uniqueTileIds = [...new Set(placedTiles.map(t => t.tileId))];
    const imagesToLoad = uniqueTileIds.filter(id => !tileImages.has(id));
    
    if (imagesToLoad.length === 0) return;
    
    const loadImages = async () => {
      const newImages = new Map(tileImages);
      
      await Promise.all(imagesToLoad.map(async (tileId) => {
        const tileDef = getTileById(tileId);
        if (!tileDef) return;
        
        const img = new Image();
        img.src = tileDef.imageData;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        newImages.set(tileId, img);
      }));
      
      setTileImages(newImages);
    };
    
    loadImages();
  }, [placedTiles]);

  // Preload custom asset images
  useEffect(() => {
    const assetsWithImages = assets.filter(a => a.custom_image_url);
    const imagesToLoad = assetsWithImages.filter(a => !assetImages.has(a.id));
    
    if (imagesToLoad.length === 0) return;
    
    const loadImages = async () => {
      const newImages = new Map(assetImages);
      
      await Promise.all(imagesToLoad.map(async (asset) => {
        if (!asset.custom_image_url) return;
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = asset.custom_image_url;
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
        newImages.set(asset.id, img);
      }));
      
      setAssetImages(newImages);
    };
    
    loadImages();
  }, [assets]);

  const width = gridWidth * cellSize;
  const height = gridHeight * cellSize;

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
  }));

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw saved drawings
    for (const drawing of drawings) {
      if (!drawing.is_visible) continue;
      drawDrawingPath(ctx, drawing);
    }

    // Draw placed tiles (below grid for visibility)
    for (const tile of placedTiles) {
      if (!tile.isVisible) continue;
      
      const tileDef = getTileById(tile.tileId);
      const tileImg = tileImages.get(tile.tileId);
      if (!tileDef) continue;
      
      const tileSize = tileDef.size * cellSize * tile.scale;
      const x = tile.x * cellSize;
      const y = tile.y * cellSize;
      
      ctx.save();
      ctx.translate(x + tileSize / 2, y + tileSize / 2);
      ctx.rotate((tile.rotation * Math.PI) / 180);
      
      if (tileImg && tileImg.complete) {
        ctx.drawImage(tileImg, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
      } else {
        // Fallback placeholder
        ctx.fillStyle = '#555';
        ctx.fillRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
      }
      
      // Selection highlight
      if (selectedTileInstanceId === tile.id) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= gridWidth; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height);
      ctx.stroke();
    }

    for (let y = 0; y <= gridHeight; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width, y * cellSize);
      ctx.stroke();
    }

    // Draw assets (sorted by layer)
    const sortedAssets = [...assets].sort((a, b) => (a.layer || 0) - (b.layer || 0));
    
    for (const asset of sortedAssets) {
      if (!asset.is_visible) continue;
      
      const assetDef = getAssetByKey(asset.asset_key);
      const customImg = assetImages.get(asset.id);
      
      // For custom image assets (from cache)
      if (asset.custom_image_url && customImg && customImg.complete) {
        const assetSize = cellSize * (asset.scale || 1);
        const x = asset.position_x * cellSize;
        const y = asset.position_y * cellSize;
        
        ctx.save();
        ctx.translate(x + assetSize / 2, y + assetSize / 2);
        ctx.rotate((asset.rotation || 0) * Math.PI / 180);
        
        ctx.drawImage(customImg, -assetSize / 2, -assetSize / 2, assetSize, assetSize);
        
        if (selectedAssetId === asset.id) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-assetSize / 2, -assetSize / 2, assetSize, assetSize);
          ctx.setLineDash([]);
        }
        
        ctx.restore();
        continue;
      }
      
      // For predefined assets (emoji icons)
      if (!assetDef) continue;
      
      const assetSize = (assetDef.size || 1) * cellSize * (asset.scale || 1);
      const x = asset.position_x * cellSize;
      const y = asset.position_y * cellSize;
      
      ctx.save();
      ctx.translate(x + assetSize / 2, y + assetSize / 2);
      ctx.rotate((asset.rotation || 0) * Math.PI / 180);
      
      ctx.font = `${assetSize * 0.7}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(assetDef.icon, 0, 0);
      
      if (selectedAssetId === asset.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-assetSize / 2, -assetSize / 2, assetSize, assetSize);
        ctx.setLineDash([]);
      }
      
      ctx.restore();
    }

    // Draw tokens
    const sortedTokens = [...tokens].sort((a, b) => (a.layer || 1) - (b.layer || 1));
    
    for (const token of sortedTokens) {
      if (!token.is_visible) continue;

      const tokenSize = (token.size || 1) * cellSize;
      const x = token.position_x * cellSize;
      const y = token.position_y * cellSize;

      ctx.fillStyle = token.color || '#ef4444';
      ctx.beginPath();
      ctx.arc(
        x + tokenSize / 2,
        y + tokenSize / 2,
        tokenSize / 2 - 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (selectedTokenId === token.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
      }
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.max(12, tokenSize / 3)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        token.name.charAt(0).toUpperCase(),
        x + tokenSize / 2,
        y + tokenSize / 2
      );
    }
  }, [gridWidth, gridHeight, cellSize, backgroundColor, tokens, assets, drawings, selectedTokenId, selectedAssetId, placedTiles, selectedTileInstanceId, tileImages, assetImages, width, height]);

  const drawDrawingPath = (ctx: CanvasRenderingContext2D, drawing: MapDrawing) => {
    if (drawing.points.length === 0) return;

    ctx.save();
    ctx.globalAlpha = drawing.opacity || 1;
    ctx.strokeStyle = drawing.color;
    ctx.fillStyle = drawing.color;
    ctx.lineWidth = drawing.brush_size || 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (drawing.tool_type) {
      case 'brush':
      case 'eraser':
        if (drawing.tool_type === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
        }
        ctx.beginPath();
        ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
        for (let i = 1; i < drawing.points.length; i++) {
          ctx.lineTo(drawing.points[i].x, drawing.points[i].y);
        }
        ctx.stroke();
        break;

      case 'line':
        if (drawing.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(drawing.points[0].x, drawing.points[0].y);
          ctx.lineTo(drawing.points[1].x, drawing.points[1].y);
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (drawing.points.length >= 2) {
          const x = Math.min(drawing.points[0].x, drawing.points[1].x);
          const y = Math.min(drawing.points[0].y, drawing.points[1].y);
          const w = Math.abs(drawing.points[1].x - drawing.points[0].x);
          const h = Math.abs(drawing.points[1].y - drawing.points[0].y);
          ctx.strokeRect(x, y, w, h);
        }
        break;

      case 'circle':
        if (drawing.points.length >= 2) {
          const dx = drawing.points[1].x - drawing.points[0].x;
          const dy = drawing.points[1].y - drawing.points[0].y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(drawing.points[0].x, drawing.points[0].y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  };

  const drawPreview = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!isDrawing || currentPoints.length === 0) return;

    ctx.save();
    ctx.globalAlpha = drawingState.brushOpacity;
    ctx.strokeStyle = drawingState.currentTool === 'eraser' ? 'rgba(255,0,0,0.5)' : drawingState.brushColor;
    ctx.lineWidth = drawingState.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (drawingState.currentTool) {
      case 'brush':
      case 'eraser':
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
        break;

      case 'line':
        if (shapeStart && currentPoints.length > 0) {
          ctx.beginPath();
          ctx.moveTo(shapeStart.x, shapeStart.y);
          ctx.lineTo(currentPoints[currentPoints.length - 1].x, currentPoints[currentPoints.length - 1].y);
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (shapeStart && currentPoints.length > 0) {
          const end = currentPoints[currentPoints.length - 1];
          const x = Math.min(shapeStart.x, end.x);
          const y = Math.min(shapeStart.y, end.y);
          const w = Math.abs(end.x - shapeStart.x);
          const h = Math.abs(end.y - shapeStart.y);
          ctx.strokeRect(x, y, w, h);
        }
        break;

      case 'circle':
        if (shapeStart && currentPoints.length > 0) {
          const end = currentPoints[currentPoints.length - 1];
          const dx = end.x - shapeStart.x;
          const dy = end.y - shapeStart.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(shapeStart.x, shapeStart.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }, [isDrawing, currentPoints, shapeStart, drawingState, width, height]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const getCanvasPosition = (clientX: number, clientY: number): DrawingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const getGridPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);
    return { x: Math.max(0, Math.min(gridWidth - 1, x)), y: Math.max(0, Math.min(gridHeight - 1, y)) };
  };

  const getTokenAtPosition = (x: number, y: number): MapToken | undefined => {
    return tokens.find((token) => {
      const size = token.size || 1;
      return (
        x >= token.position_x &&
        x < token.position_x + size &&
        y >= token.position_y &&
        y < token.position_y + size
      );
    });
  };

  const getAssetAtPosition = (x: number, y: number): MapAsset | undefined => {
    return assets.find((asset) => {
      const assetDef = getAssetByKey(asset.asset_key);
      const size = (assetDef?.size || 1) * (asset.scale || 1);
      return (
        x >= asset.position_x &&
        x < asset.position_x + size &&
        y >= asset.position_y &&
        y < asset.position_y + size
      );
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Drawing tools
    if (drawingState.currentTool !== 'select') {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      
      if (drawingState.currentTool === 'fill') {
        const gridPos = getGridPosition(e.clientX, e.clientY);
        onFloodFill?.(gridPos.x, gridPos.y, drawingState.brushColor);
        return;
      }

      setIsDrawing(true);
      setCurrentPoints([pos]);
      if (['line', 'rectangle', 'circle'].includes(drawingState.currentTool)) {
        setShapeStart(pos);
      }
      return;
    }

    // Selection mode
    const pos = getGridPosition(e.clientX, e.clientY);
    
    const token = getTokenAtPosition(pos.x, pos.y);
    if (token) {
      onTokenSelect(token.id);
      onAssetSelect?.(null);
      setDragState({
        isDragging: true,
        tokenId: token.id,
        startX: token.position_x,
        startY: token.position_y,
        offsetX: pos.x - token.position_x,
        offsetY: pos.y - token.position_y,
      });
      return;
    }
    
    const asset = getAssetAtPosition(pos.x, pos.y);
    if (asset) {
      onAssetSelect?.(asset.id);
      onTokenSelect(null);
      return;
    }
    
    onTokenSelect(null);
    onAssetSelect?.(null);
    onCellClick(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawing && drawingState.currentTool !== 'select') {
      const pos = getCanvasPosition(e.clientX, e.clientY);
      
      if (['brush', 'eraser'].includes(drawingState.currentTool)) {
        setCurrentPoints((prev) => [...prev, pos]);
      } else {
        setCurrentPoints([pos]);
      }
      return;
    }

    if (!dragState.isDragging || !dragState.tokenId) return;

    const pos = getGridPosition(e.clientX, e.clientY);
    const newX = pos.x - dragState.offsetX;
    const newY = pos.y - dragState.offsetY;

    const token = tokens.find((t) => t.id === dragState.tokenId);
    if (!token) return;

    const size = token.size || 1;
    const clampedX = Math.max(0, Math.min(gridWidth - size, newX));
    const clampedY = Math.max(0, Math.min(gridHeight - size, newY));

    if (clampedX !== token.position_x || clampedY !== token.position_y) {
      onTokenMove(dragState.tokenId, clampedX, clampedY);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    
    if (isDrawing && currentPoints.length > 0) {
      const points = ['line', 'rectangle', 'circle'].includes(drawingState.currentTool) && shapeStart
        ? [shapeStart, currentPoints[currentPoints.length - 1]]
        : currentPoints;

      onDrawingComplete?.({
        layer: drawingState.activeLayerId ? 0 : 0,
        tool_type: drawingState.currentTool,
        color: drawingState.brushColor,
        brush_size: drawingState.brushSize,
        opacity: drawingState.brushOpacity,
        points,
        is_visible: true,
      });
    }

    setIsDrawing(false);
    setCurrentPoints([]);
    setShapeStart(null);
    setDragState({
      isDragging: false,
      tokenId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const pos = getGridPosition(e.clientX, e.clientY);
      
      // Handle tileset tile drop
      if (data.type === 'tileset-tile' && data.tileId && onTileDrop) {
        onTileDrop(data.tileId, pos.x, pos.y);
        return;
      }
      
      // Handle cached asset drop (from Forgotten Adventures cache)
      if (data.type === 'cached-asset' && data.thumbnailUrl && onAssetDrop) {
        onAssetDrop(data.assetKey, data.category, pos.x, pos.y, data.thumbnailUrl, data.name);
        return;
      }
      
      // Handle standard asset drop
      if (data.assetKey && onAssetDrop) {
        onAssetDrop(data.assetKey, data.category, pos.x, pos.y);
      }
    } catch (err) {
      // Invalid drop data
    }
  };

  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (dragState.isDragging) return 'grabbing';
    
    switch (drawingState.currentTool) {
      case 'brush':
      case 'eraser':
        return 'crosshair';
      case 'line':
      case 'rectangle':
      case 'circle':
        return 'crosshair';
      case 'fill':
        return 'cell';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto bg-background/50 rounded-lg border border-border h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          cursor: getCursor(),
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block"
        />
        <canvas
          ref={drawingCanvasRef}
          width={width}
          height={height}
          className="block absolute top-0 left-0 pointer-events-none"
        />
        
        {/* 3D Model placeholders overlay */}
        <Model3DOverlay
          models={models3D}
          cellSize={cellSize}
          selectedModelId={selectedModel3DId || null}
          onModelSelect={(id) => {
            onModel3DSelect?.(id);
            if (id) {
              onTokenSelect(null);
              onAssetSelect?.(null);
            }
          }}
          onModelMove={onModel3DMove}
          onSwitchTo3D={onSwitchTo3D}
        />
      </div>
    </div>
  );
});
