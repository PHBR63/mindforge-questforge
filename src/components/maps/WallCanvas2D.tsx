import { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  MapFloor,
  MapWall,
  MapWallOpening,
  MapLight,
  WallEditorState,
  calculateWallLength,
  convertUnit,
} from './wallTypes';

interface WallCanvas2DProps {
  floor: MapFloor | null;
  walls: MapWall[];
  openings: MapWallOpening[];
  lights: MapLight[];
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  editorState: WallEditorState;
  selectedWallId: string | null;
  selectedLightId: string | null;
  onWallCreate: (wall: Omit<MapWall, 'id' | 'map_id' | 'floor_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onWallSelect: (wallId: string | null) => void;
  onWallUpdate: (wallId: string, updates: Partial<MapWall>) => void;
  onWallDelete: (wallId: string) => void;
  onOpeningCreate: (wallId: string, opening: Omit<MapWallOpening, 'id' | 'wall_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onLightCreate: (light: Omit<MapLight, 'id' | 'map_id' | 'floor_id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onLightSelect: (lightId: string | null) => void;
  onLightUpdate: (lightId: string, updates: Partial<MapLight>) => void;
  onLightDelete: (lightId: string) => void;
}

interface DrawingWall {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function WallCanvas2D({
  floor,
  walls,
  openings,
  lights,
  gridWidth,
  gridHeight,
  cellSize,
  editorState,
  selectedWallId,
  selectedLightId,
  onWallCreate,
  onWallSelect,
  onWallUpdate,
  onWallDelete,
  onOpeningCreate,
  onLightCreate,
  onLightSelect,
  onLightUpdate,
  onLightDelete,
}: WallCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [drawingWall, setDrawingWall] = useState<DrawingWall | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const width = gridWidth * cellSize;
  const height = gridHeight * cellSize;

  // Snap to grid helper
  const snapToGrid = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      if (!editorState.snapToGrid) return { x, y };
      const snappedX = Math.round(x / cellSize) * cellSize;
      const snappedY = Math.round(y / cellSize) * cellSize;
      return { x: snappedX, y: snappedY };
    },
    [editorState.snapToGrid, cellSize]
  );

  // Get canvas position from mouse event
  const getCanvasPosition = useCallback(
    (e: React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Draw the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw floor plan background
    if (floor?.floor_plan_url) {
      const img = new Image();
      img.src = floor.floor_plan_url;
      if (img.complete) {
        ctx.globalAlpha = floor.floor_plan_opacity;
        const scale = floor.floor_plan_scale;
        ctx.drawImage(
          img,
          floor.floor_plan_offset_x,
          floor.floor_plan_offset_y,
          img.width * scale,
          img.height * scale
        );
        ctx.globalAlpha = 1;
      }
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1 / zoom;

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

    // Draw walls
    walls.forEach((wall) => {
      if (!wall.is_visible) return;

      const isSelected = wall.id === selectedWallId;
      const thickness = wall.thickness * cellSize;

      // Calculate perpendicular offset for wall thickness
      const dx = wall.end_x - wall.start_x;
      const dy = wall.end_y - wall.start_y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = (-dy / len) * (thickness / 2);
      const ny = (dx / len) * (thickness / 2);

      // Draw wall as rectangle
      ctx.beginPath();
      ctx.moveTo(wall.start_x * cellSize + nx, wall.start_y * cellSize + ny);
      ctx.lineTo(wall.end_x * cellSize + nx, wall.end_y * cellSize + ny);
      ctx.lineTo(wall.end_x * cellSize - nx, wall.end_y * cellSize - ny);
      ctx.lineTo(wall.start_x * cellSize - nx, wall.start_y * cellSize - ny);
      ctx.closePath();

      ctx.fillStyle = wall.color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();
      }

      // Draw openings for this wall
      const wallOpenings = openings.filter((o) => o.wall_id === wall.id);
      wallOpenings.forEach((opening) => {
        const pos = opening.position_along_wall;
        const openingX = wall.start_x + (wall.end_x - wall.start_x) * pos;
        const openingY = wall.start_y + (wall.end_y - wall.start_y) * pos;
        const openingWidth = opening.width * cellSize * 0.5;

        // Draw opening as gap
        ctx.beginPath();
        ctx.arc(openingX * cellSize, openingY * cellSize, openingWidth, 0, Math.PI * 2);
        ctx.fillStyle = opening.opening_type === 'door' ? '#8B4513' : '#87CEEB';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
      });

      // Draw measurements
      if (editorState.showMeasurements) {
        const length = calculateWallLength(wall);
        const displayLength =
          editorState.measurementUnit === 'feet'
            ? convertUnit(length, 'meters', 'feet')
            : length;

        const midX = ((wall.start_x + wall.end_x) / 2) * cellSize;
        const midY = ((wall.start_y + wall.end_y) / 2) * cellSize;

        ctx.fillStyle = '#ffffff';
        ctx.font = `${12 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `${displayLength.toFixed(1)}${editorState.measurementUnit === 'feet' ? 'ft' : 'm'}`,
          midX,
          midY - 10 / zoom
        );
      }
    });

    // Draw lights
    lights.forEach((light) => {
      if (!light.is_visible) return;

      const isSelected = light.id === selectedLightId;
      const x = light.position_x * cellSize;
      const y = light.position_y * cellSize;

      // Draw light range
      ctx.beginPath();
      ctx.arc(x, y, light.range * cellSize, 0, Math.PI * 2);
      ctx.fillStyle = `${light.color}20`;
      ctx.fill();

      // Draw light icon
      ctx.beginPath();
      ctx.arc(x, y, 8 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = light.color;
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3 / zoom;
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / zoom;
      }
      ctx.stroke();

      // Draw rays for point lights
      if (light.light_type === 'point') {
        ctx.strokeStyle = light.color;
        ctx.lineWidth = 1 / zoom;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(angle) * 10 / zoom, y + Math.sin(angle) * 10 / zoom);
          ctx.lineTo(x + Math.cos(angle) * 16 / zoom, y + Math.sin(angle) * 16 / zoom);
          ctx.stroke();
        }
      }
    });

    // Draw wall being created
    if (drawingWall) {
      const thickness = editorState.wallThickness * cellSize;
      const dx = drawingWall.endX - drawingWall.startX;
      const dy = drawingWall.endY - drawingWall.startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len > 0) {
        const nx = (-dy / len) * (thickness / 2);
        const ny = (dx / len) * (thickness / 2);

        ctx.beginPath();
        ctx.moveTo(drawingWall.startX + nx, drawingWall.startY + ny);
        ctx.lineTo(drawingWall.endX + nx, drawingWall.endY + ny);
        ctx.lineTo(drawingWall.endX - nx, drawingWall.endY - ny);
        ctx.lineTo(drawingWall.startX - nx, drawingWall.startY - ny);
        ctx.closePath();

        ctx.fillStyle = editorState.wallColor + '80';
        ctx.fill();
        ctx.strokeStyle = editorState.wallColor;
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        // Show preview measurement
        if (editorState.showMeasurements) {
          const length = len / cellSize;
          const displayLength =
            editorState.measurementUnit === 'feet'
              ? convertUnit(length, 'meters', 'feet')
              : length;

          const midX = (drawingWall.startX + drawingWall.endX) / 2;
          const midY = (drawingWall.startY + drawingWall.endY) / 2;

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${14 / zoom}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(
            `${displayLength.toFixed(1)}${editorState.measurementUnit === 'feet' ? 'ft' : 'm'}`,
            midX,
            midY - 15 / zoom
          );
        }
      }
    }

    ctx.restore();
  }, [
    floor,
    walls,
    openings,
    lights,
    gridWidth,
    gridHeight,
    cellSize,
    width,
    height,
    pan,
    zoom,
    selectedWallId,
    selectedLightId,
    editorState,
    drawingWall,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasPosition(e);

    // Pan with middle button or alt+click
    if (e.button === 1 || (e.button === 0 && e.altKey) || editorState.currentTool === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Select tool
    if (editorState.currentTool === 'select') {
      // Check if clicking on a light
      const clickedLight = lights.find((l) => {
        const dx = pos.x - l.position_x * cellSize;
        const dy = pos.y - l.position_y * cellSize;
        return Math.sqrt(dx * dx + dy * dy) < 15;
      });

      if (clickedLight) {
        onLightSelect(clickedLight.id);
        onWallSelect(null);
        return;
      }

      // Check if clicking on a wall
      const clickedWall = walls.find((w) => {
        const tolerance = (w.thickness * cellSize) / 2 + 5;
        const px = pos.x / cellSize;
        const py = pos.y / cellSize;

        // Point-to-line-segment distance
        const dx = w.end_x - w.start_x;
        const dy = w.end_y - w.start_y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) {
          return Math.sqrt((px - w.start_x) ** 2 + (py - w.start_y) ** 2) < tolerance / cellSize;
        }

        let t = ((px - w.start_x) * dx + (py - w.start_y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const nearestX = w.start_x + t * dx;
        const nearestY = w.start_y + t * dy;
        const dist = Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);

        return dist < tolerance / cellSize;
      });

      onWallSelect(clickedWall?.id || null);
      onLightSelect(null);
      return;
    }

    // Wall tool
    if (editorState.currentTool === 'wall') {
      const snapped = snapToGrid(pos.x, pos.y);
      setDrawingWall({
        startX: snapped.x,
        startY: snapped.y,
        endX: snapped.x,
        endY: snapped.y,
      });
      setIsDrawing(true);
      return;
    }

    // Light tool
    if (editorState.currentTool === 'light') {
      const snapped = snapToGrid(pos.x, pos.y);
      onLightCreate({
        light_type: editorState.lightType,
        position_x: snapped.x / cellSize,
        position_y: snapped.y / cellSize,
        position_z: floor?.height || 2.5,
        color: editorState.lightColor,
        intensity: editorState.lightIntensity,
        range: editorState.lightRange,
        cast_shadows: true,
        is_visible: true,
      });
      return;
    }

    // Door/Window tool
    if (editorState.currentTool === 'door' || editorState.currentTool === 'window') {
      const clickedWall = walls.find((w) => {
        const tolerance = (w.thickness * cellSize) / 2 + 10;
        const px = pos.x / cellSize;
        const py = pos.y / cellSize;

        const dx = w.end_x - w.start_x;
        const dy = w.end_y - w.start_y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) return false;

        let t = ((px - w.start_x) * dx + (py - w.start_y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const nearestX = w.start_x + t * dx;
        const nearestY = w.start_y + t * dy;
        const dist = Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);

        return dist < tolerance / cellSize;
      });

      if (clickedWall) {
        const dx = clickedWall.end_x - clickedWall.start_x;
        const dy = clickedWall.end_y - clickedWall.start_y;
        const lenSq = dx * dx + dy * dy;
        const px = pos.x / cellSize;
        const py = pos.y / cellSize;

        let t = ((px - clickedWall.start_x) * dx + (py - clickedWall.start_y) * dy) / lenSq;
        t = Math.max(0.1, Math.min(0.9, t));

        onOpeningCreate(clickedWall.id, {
          opening_type: editorState.currentTool as 'door' | 'window',
          position_along_wall: t,
          width: editorState.openingWidth,
          height: editorState.openingHeight,
          elevation: editorState.currentTool === 'window' ? 1.0 : 0,
          color: null,
          is_open: false,
        });
      }
      return;
    }

    // Erase tool
    if (editorState.currentTool === 'erase') {
      // Check lights first
      const clickedLight = lights.find((l) => {
        const dx = pos.x - l.position_x * cellSize;
        const dy = pos.y - l.position_y * cellSize;
        return Math.sqrt(dx * dx + dy * dy) < 15;
      });

      if (clickedLight) {
        onLightDelete(clickedLight.id);
        return;
      }

      // Check walls
      const clickedWall = walls.find((w) => {
        const tolerance = (w.thickness * cellSize) / 2 + 5;
        const px = pos.x / cellSize;
        const py = pos.y / cellSize;

        const dx = w.end_x - w.start_x;
        const dy = w.end_y - w.start_y;
        const lenSq = dx * dx + dy * dy;

        if (lenSq === 0) return false;

        let t = ((px - w.start_x) * dx + (py - w.start_y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const nearestX = w.start_x + t * dx;
        const nearestY = w.start_y + t * dy;
        const dist = Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);

        return dist < tolerance / cellSize;
      });

      if (clickedWall) {
        onWallDelete(clickedWall.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDrawing && drawingWall) {
      const pos = getCanvasPosition(e);
      const snapped = snapToGrid(pos.x, pos.y);
      setDrawingWall({
        ...drawingWall,
        endX: snapped.x,
        endY: snapped.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (isDrawing && drawingWall) {
      const dx = drawingWall.endX - drawingWall.startX;
      const dy = drawingWall.endY - drawingWall.startY;
      const len = Math.sqrt(dx * dx + dy * dy);

      // Only create wall if it has some length
      if (len > cellSize * 0.5) {
        onWallCreate({
          start_x: drawingWall.startX / cellSize,
          start_y: drawingWall.startY / cellSize,
          end_x: drawingWall.endX / cellSize,
          end_y: drawingWall.endY / cellSize,
          height: editorState.wallHeight,
          thickness: editorState.wallThickness,
          color: editorState.wallColor,
          texture: null,
          is_visible: true,
        });
      }

      setDrawingWall(null);
      setIsDrawing(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.25, Math.min(4, zoom * delta));
    setZoom(newZoom);
  };

  const getCursor = () => {
    if (isPanning || editorState.currentTool === 'pan') return 'grab';
    switch (editorState.currentTool) {
      case 'wall':
      case 'door':
      case 'window':
        return 'crosshair';
      case 'light':
        return 'cell';
      case 'erase':
        return 'pointer';
      default:
        return 'default';
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background/50 rounded-lg border border-border"
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: getCursor() }}
        className="block"
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
