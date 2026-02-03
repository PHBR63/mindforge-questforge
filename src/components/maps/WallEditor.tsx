import { Suspense, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows, Environment } from '@react-three/drei';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Grid3X3, Box, Download, Upload, Undo2, Redo2 } from 'lucide-react';
import { WallEditorToolbar } from './WallEditorToolbar';
import { FloorPanel } from './FloorPanel';
import { WallCanvas2D } from './WallCanvas2D';
import { WallScene3DContent } from './WallScene3DContent';
import {
  MapFloor,
  MapWall,
  MapWallOpening,
  MapLight,
  WallEditorState,
  WallEditorTool,
  DEFAULT_WALL_EDITOR_STATE,
} from './wallTypes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WallEditorProps {
  mapId: string;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
}

type ViewMode = '2d' | '3d';

interface HistoryState {
  walls: MapWall[];
  openings: MapWallOpening[];
  lights: MapLight[];
}

export function WallEditor({ mapId, gridWidth, gridHeight, cellSize }: WallEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [editorState, setEditorState] = useState<WallEditorState>(DEFAULT_WALL_EDITOR_STATE);

  // Data
  const [floors, setFloors] = useState<MapFloor[]>([]);
  const [walls, setWalls] = useState<MapWall[]>([]);
  const [openings, setOpenings] = useState<MapWallOpening[]>([]);
  const [lights, setLights] = useState<MapLight[]>([]);

  // Selection
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const [floorsResult, wallsResult, openingsResult, lightsResult] = await Promise.all([
        supabase.from('map_floors').select('*').eq('map_id', mapId).order('floor_number'),
        supabase.from('map_walls').select('*').eq('map_id', mapId),
        supabase.from('map_wall_openings').select('*'),
        supabase.from('map_lights').select('*').eq('map_id', mapId),
      ]);

      if (floorsResult.data) {
        const typedFloors = floorsResult.data.map((f: any) => ({
          ...f,
          height: Number(f.height),
          floor_plan_opacity: Number(f.floor_plan_opacity),
          floor_plan_scale: Number(f.floor_plan_scale),
          floor_plan_offset_x: Number(f.floor_plan_offset_x),
          floor_plan_offset_y: Number(f.floor_plan_offset_y),
        })) as MapFloor[];
        setFloors(typedFloors);
        if (typedFloors.length > 0 && !activeFloorId) {
          setActiveFloorId(typedFloors[0].id);
        }
      }

      if (wallsResult.data) {
        const typedWalls = wallsResult.data.map((w: any) => ({
          ...w,
          start_x: Number(w.start_x),
          start_y: Number(w.start_y),
          end_x: Number(w.end_x),
          end_y: Number(w.end_y),
          height: Number(w.height),
          thickness: Number(w.thickness),
        })) as MapWall[];
        setWalls(typedWalls);
      }

      if (openingsResult.data) {
        const typedOpenings = openingsResult.data.map((o: any) => ({
          ...o,
          position_along_wall: Number(o.position_along_wall),
          width: Number(o.width),
          height: Number(o.height),
          elevation: Number(o.elevation),
        })) as MapWallOpening[];
        setOpenings(typedOpenings);
      }

      if (lightsResult.data) {
        const typedLights = lightsResult.data.map((l: any) => ({
          ...l,
          position_x: Number(l.position_x),
          position_y: Number(l.position_y),
          position_z: Number(l.position_z),
          intensity: Number(l.intensity),
          range: Number(l.range),
        })) as MapLight[];
        setLights(typedLights);
      }

      // Initialize history
      if (wallsResult.data && openingsResult.data && lightsResult.data) {
        setHistory([{
          walls: wallsResult.data as MapWall[],
          openings: openingsResult.data as MapWallOpening[],
          lights: lightsResult.data as MapLight[],
        }]);
        setHistoryIndex(0);
      }
    };

    loadData();
  }, [mapId]);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = { walls, openings, lights };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [walls, openings, lights, history, historyIndex]);

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setWalls(prevState.walls);
      setOpenings(prevState.openings);
      setLights(prevState.lights);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setWalls(nextState.walls);
      setOpenings(nextState.openings);
      setLights(nextState.lights);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Floor handlers
  const handleFloorCreate = async (name: string, floorNumber: number) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('map_floors')
      .insert({
        map_id: mapId,
        user_id: user.id,
        name,
        floor_number: floorNumber,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar andar', description: error.message });
      return;
    }

    const newFloor = {
      ...data,
      height: Number(data.height),
      floor_plan_opacity: Number(data.floor_plan_opacity),
      floor_plan_scale: Number(data.floor_plan_scale),
      floor_plan_offset_x: Number(data.floor_plan_offset_x),
      floor_plan_offset_y: Number(data.floor_plan_offset_y),
    } as MapFloor;

    setFloors([...floors, newFloor].sort((a, b) => a.floor_number - b.floor_number));
    setActiveFloorId(newFloor.id);
    toast({ title: 'Andar criado', description: `${name} foi adicionado.` });
  };

  const handleFloorUpdate = async (floorId: string, updates: Partial<MapFloor>) => {
    setFloors(floors.map((f) => (f.id === floorId ? { ...f, ...updates } : f)));

    await supabase.from('map_floors').update(updates).eq('id', floorId);
  };

  const handleFloorDelete = async (floorId: string) => {
    const { error } = await supabase.from('map_floors').delete().eq('id', floorId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir andar', description: error.message });
      return;
    }

    const remaining = floors.filter((f) => f.id !== floorId);
    setFloors(remaining);
    if (activeFloorId === floorId) {
      setActiveFloorId(remaining[0]?.id || null);
    }
    // Also remove walls and lights for this floor
    setWalls(walls.filter((w) => w.floor_id !== floorId));
    setLights(lights.filter((l) => l.floor_id !== floorId));
  };

  const handleFloorPlanUpload = async (floorId: string, file: File) => {
    const fileName = `floor-plans/${mapId}/${floorId}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('campaign-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: uploadError.message });
      return;
    }

    const { data: urlData } = supabase.storage.from('campaign-assets').getPublicUrl(fileName);

    await handleFloorUpdate(floorId, { floor_plan_url: urlData.publicUrl });
    toast({ title: 'Planta carregada', description: 'A planta baixa foi adicionada ao andar.' });
  };

  // Wall handlers
  const handleWallCreate = async (
    wallData: Omit<MapWall, 'id' | 'map_id' | 'floor_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user || !activeFloorId) return;

    const { data, error } = await supabase
      .from('map_walls')
      .insert({
        map_id: mapId,
        floor_id: activeFloorId,
        user_id: user.id,
        ...wallData,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar parede', description: error.message });
      return;
    }

    const newWall = {
      ...data,
      start_x: Number(data.start_x),
      start_y: Number(data.start_y),
      end_x: Number(data.end_x),
      end_y: Number(data.end_y),
      height: Number(data.height),
      thickness: Number(data.thickness),
    } as MapWall;

    setWalls([...walls, newWall]);
    saveToHistory();
  };

  const handleWallUpdate = async (wallId: string, updates: Partial<MapWall>) => {
    setWalls(walls.map((w) => (w.id === wallId ? { ...w, ...updates } : w)));
    await supabase.from('map_walls').update(updates).eq('id', wallId);
    saveToHistory();
  };

  const handleWallDelete = async (wallId: string) => {
    const { error } = await supabase.from('map_walls').delete().eq('id', wallId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir parede', description: error.message });
      return;
    }

    setWalls(walls.filter((w) => w.id !== wallId));
    setOpenings(openings.filter((o) => o.wall_id !== wallId));
    saveToHistory();
  };

  // Opening handlers
  const handleOpeningCreate = async (
    wallId: string,
    openingData: Omit<MapWallOpening, 'id' | 'wall_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('map_wall_openings')
      .insert({
        wall_id: wallId,
        user_id: user.id,
        ...openingData,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar abertura', description: error.message });
      return;
    }

    const newOpening = {
      ...data,
      position_along_wall: Number(data.position_along_wall),
      width: Number(data.width),
      height: Number(data.height),
      elevation: Number(data.elevation),
    } as MapWallOpening;

    setOpenings([...openings, newOpening]);
    saveToHistory();
  };

  // Light handlers
  const handleLightCreate = async (
    lightData: Omit<MapLight, 'id' | 'map_id' | 'floor_id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    if (!user || !activeFloorId) return;

    const { data, error } = await supabase
      .from('map_lights')
      .insert({
        map_id: mapId,
        floor_id: activeFloorId,
        user_id: user.id,
        ...lightData,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar luz', description: error.message });
      return;
    }

    const newLight = {
      ...data,
      position_x: Number(data.position_x),
      position_y: Number(data.position_y),
      position_z: Number(data.position_z),
      intensity: Number(data.intensity),
      range: Number(data.range),
    } as MapLight;

    setLights([...lights, newLight]);
    saveToHistory();
  };

  const handleLightUpdate = async (lightId: string, updates: Partial<MapLight>) => {
    setLights(lights.map((l) => (l.id === lightId ? { ...l, ...updates } : l)));
    await supabase.from('map_lights').update(updates).eq('id', lightId);
    saveToHistory();
  };

  const handleLightDelete = async (lightId: string) => {
    const { error } = await supabase.from('map_lights').delete().eq('id', lightId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir luz', description: error.message });
      return;
    }

    setLights(lights.filter((l) => l.id !== lightId));
    saveToHistory();
  };

  // Export
  const handleExport = () => {
    const data = {
      floors,
      walls,
      openings,
      lights,
      metadata: {
        gridWidth,
        gridHeight,
        cellSize,
        exportedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wall-layout-${mapId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exportado', description: 'Layout de paredes exportado com sucesso.' });
  };

  const activeFloor = floors.find((f) => f.id === activeFloorId) || null;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="2d" className="gap-2">
                <Grid3X3 className="w-4 h-4" />
                2D
              </TabsTrigger>
              <TabsTrigger value="3d" className="gap-2">
                <Box className="w-4 h-4" />
                3D
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Main content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left panel - Tools & Floors */}
        <div className="flex flex-col gap-4 w-72 shrink-0">
          {viewMode === '2d' && (
            <WallEditorToolbar
              editorState={editorState}
              onToolChange={(tool) => setEditorState({ ...editorState, currentTool: tool })}
              onStateChange={(updates) => setEditorState({ ...editorState, ...updates })}
            />
          )}

          <FloorPanel
            floors={floors}
            activeFloorId={activeFloorId}
            onFloorSelect={setActiveFloorId}
            onFloorCreate={handleFloorCreate}
            onFloorUpdate={handleFloorUpdate}
            onFloorDelete={handleFloorDelete}
            onFloorPlanUpload={handleFloorPlanUpload}
          />
        </div>

        {/* Canvas area */}
        <div className="flex-1 min-w-0">
          {viewMode === '2d' ? (
            <WallCanvas2D
              floor={activeFloor}
              walls={walls.filter((w) => w.floor_id === activeFloorId)}
              openings={openings.filter((o) =>
                walls.filter((w) => w.floor_id === activeFloorId).some((w) => w.id === o.wall_id)
              )}
              lights={lights.filter((l) => l.floor_id === activeFloorId)}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
              cellSize={cellSize}
              editorState={editorState}
              selectedWallId={selectedWallId}
              selectedLightId={selectedLightId}
              onWallCreate={handleWallCreate}
              onWallSelect={setSelectedWallId}
              onWallUpdate={handleWallUpdate}
              onWallDelete={handleWallDelete}
              onOpeningCreate={handleOpeningCreate}
              onLightCreate={handleLightCreate}
              onLightSelect={setSelectedLightId}
              onLightUpdate={handleLightUpdate}
              onLightDelete={handleLightDelete}
            />
          ) : (
            <div className="w-full h-full rounded-lg overflow-hidden border border-border">
              <Canvas shadows>
                <Suspense fallback={null}>
                  <PerspectiveCamera
                    makeDefault
                    position={[gridWidth * cellSize * 0.6, gridWidth * cellSize * 0.5, gridHeight * cellSize * 0.6]}
                    fov={50}
                  />
                  <OrbitControls
                    enablePan
                    enableZoom
                    enableRotate
                    minDistance={5}
                    maxDistance={gridWidth * cellSize * 3}
                    maxPolarAngle={Math.PI / 2 - 0.1}
                  />

                  <ambientLight intensity={0.2} />

                  <WallScene3DContent
                    floors={floors}
                    walls={walls}
                    openings={openings}
                    lights={lights}
                    activeFloorId={activeFloorId}
                    cellSize={cellSize}
                    gridWidth={gridWidth}
                    gridHeight={gridHeight}
                  />

                  <ContactShadows
                    position={[0, 0, 0]}
                    opacity={0.4}
                    scale={gridWidth * cellSize * 2}
                    blur={2}
                    far={10}
                  />
                </Suspense>
              </Canvas>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
