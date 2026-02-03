import { useRef, useEffect, useState, useCallback } from 'react';
import { MapToken, TokenDragState } from './types';
import { MapAsset, getAssetByKey } from './assetTypes';

interface MapGridProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  backgroundColor: string;
  tokens: MapToken[];
  assets?: MapAsset[];
  selectedTokenId: string | null;
  selectedAssetId?: string | null;
  onTokenMove: (tokenId: string, x: number, y: number) => void;
  onTokenSelect: (tokenId: string | null) => void;
  onAssetSelect?: (assetId: string | null) => void;
  onAssetMove?: (assetId: string, x: number, y: number) => void;
  onCellClick: (x: number, y: number) => void;
  onAssetDrop?: (assetKey: string, category: string, x: number, y: number) => void;
}

export function MapGrid({
  gridWidth,
  gridHeight,
  cellSize,
  backgroundColor,
  tokens,
  assets = [],
  selectedTokenId,
  selectedAssetId,
  onTokenMove,
  onTokenSelect,
  onAssetSelect,
  onAssetMove,
  onCellClick,
  onAssetDrop,
}: MapGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  const width = gridWidth * cellSize;
  const height = gridHeight * cellSize;

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

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
      if (!assetDef) continue;
      
      const assetSize = (assetDef.size || 1) * cellSize * (asset.scale || 1);
      const x = asset.position_x * cellSize;
      const y = asset.position_y * cellSize;
      
      ctx.save();
      ctx.translate(x + assetSize / 2, y + assetSize / 2);
      ctx.rotate((asset.rotation || 0) * Math.PI / 180);
      
      // Draw asset icon
      ctx.font = `${assetSize * 0.7}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(assetDef.icon, 0, 0);
      
      // Selection indicator
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

      // Token background
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

      // Token border
      if (selectedTokenId === token.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
      }
      ctx.stroke();

      // Token initial
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
  }, [gridWidth, gridHeight, cellSize, backgroundColor, tokens, assets, selectedTokenId, selectedAssetId, width, height]);

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

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
      // Middle mouse or Alt+Left click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const pos = getGridPosition(e.clientX, e.clientY);
    
    // Check for token first (tokens are on top)
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
    
    // Check for asset
    const asset = getAssetAtPosition(pos.x, pos.y);
    if (asset) {
      onAssetSelect?.(asset.id);
      onTokenSelect(null);
      return;
    }
    
    // Empty cell
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
      if (data.assetKey && onAssetDrop) {
        const pos = getGridPosition(e.clientX, e.clientY);
        onAssetDrop(data.assetKey, data.category, pos.x, pos.y);
      }
    } catch (err) {
      // Invalid drop data
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
          cursor: isPanning ? 'grabbing' : dragState.isDragging ? 'grabbing' : 'default',
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
      </div>
    </div>
  );
}
