import { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  ContactShadows,
  Stars,
  Sky
} from '@react-three/drei';
import { Grid3D } from './Grid3D';
import { Token3D } from './Token3D';
import { TransformableModel3D, ModelLoadingFallback } from './TransformableModel3D';
import { Transform3DToolbar, TransformMode } from './Transform3DToolbar';
import { MapToken } from './types';
import { Map3DModel } from './model3DTypes';

interface MapScene3DProps {
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  backgroundColor: string;
  tokens: MapToken[];
  models3D?: Map3DModel[];
  selectedTokenId: string | null;
  selectedModel3DId?: string | null;
  onTokenSelect: (tokenId: string | null) => void;
  onModel3DSelect?: (modelId: string | null) => void;
  onModel3DUpdate?: (modelId: string, updates: Partial<Map3DModel>) => void;
  onModel3DDuplicate?: (modelId: string) => void;
  environment?: 'day' | 'night' | 'dungeon';
}

interface SceneProps extends MapScene3DProps {
  transformMode: TransformMode;
  snapToGrid: boolean;
}

function Scene({
  gridWidth,
  gridHeight,
  cellSize,
  backgroundColor,
  tokens,
  models3D = [],
  selectedTokenId,
  selectedModel3DId,
  onTokenSelect,
  onModel3DSelect,
  onModel3DUpdate,
  environment = 'dungeon',
  transformMode,
  snapToGrid,
}: SceneProps) {
  const totalWidth = gridWidth * cellSize;
  const totalHeight = gridHeight * cellSize;
  
  const visibleModels = models3D.filter((m) => m.is_visible);
  
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera 
        makeDefault 
        position={[0, totalWidth * 0.8, totalHeight * 0.6]} 
        fov={50}
      />
      
      {/* Controls - disabled when transforming */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={totalWidth * 2}
        maxPolarAngle={Math.PI / 2 - 0.1}
        enabled={!selectedModel3DId}
      />
      
      {/* Lighting based on environment */}
      {environment === 'day' && (
        <>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 20, 10]} 
            intensity={1} 
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
        </>
      )}
      
      {environment === 'night' && (
        <>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <ambientLight intensity={0.15} color="#4466aa" />
          <pointLight position={[0, 10, 0]} intensity={0.5} color="#aabbff" />
        </>
      )}
      
      {environment === 'dungeon' && (
        <>
          <ambientLight intensity={0.3} color="#ffaa77" />
          <pointLight position={[0, 8, 0]} intensity={0.8} color="#ff9944" distance={30} />
          <pointLight position={[-totalWidth/3, 5, -totalHeight/3]} intensity={0.4} color="#ff6600" distance={20} />
          <pointLight position={[totalWidth/3, 5, totalHeight/3]} intensity={0.4} color="#ff6600" distance={20} />
        </>
      )}
      
      {/* Ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.01, 0]} 
        receiveShadow
        onClick={() => {
          onTokenSelect(null);
          onModel3DSelect?.(null);
        }}
      >
        <planeGeometry args={[totalWidth + 4, totalHeight + 4]} />
        <meshStandardMaterial 
          color={backgroundColor}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>
      
      {/* Grid */}
      <Grid3D 
        width={gridWidth} 
        height={gridHeight} 
        cellSize={cellSize}
        color={environment === 'night' ? '#334466' : '#555577'}
      />
      
      {/* Tokens */}
      {tokens.map((token) => (
        <Token3D
          key={token.id}
          token={token}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          cellSize={cellSize}
          isSelected={selectedTokenId === token.id}
          onClick={() => {
            onTokenSelect(token.id);
            onModel3DSelect?.(null);
          }}
        />
      ))}

      {/* 3D Models with TransformControls */}
      {visibleModels.map((model) => (
        <Suspense key={model.id} fallback={<ModelLoadingFallback />}>
          <TransformableModel3D
            model={model}
            cellSize={cellSize}
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            isSelected={selectedModel3DId === model.id}
            transformMode={transformMode}
            snapToGrid={snapToGrid}
            onSelect={() => {
              onModel3DSelect?.(model.id);
              onTokenSelect(null);
            }}
            onTransformEnd={(updates) => {
              onModel3DUpdate?.(model.id, updates);
            }}
          />
        </Suspense>
      ))}
      
      {/* Contact shadows */}
      <ContactShadows 
        position={[0, 0, 0]}
        opacity={0.4}
        scale={totalWidth}
        blur={2}
        far={4}
      />
    </>
  );
}

export function MapScene3D(props: MapScene3DProps) {
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'g':
          setTransformMode('translate');
          break;
        case 'r':
          setTransformMode('rotate');
          break;
        case 's':
          if (!e.ctrlKey && !e.metaKey) {
            setTransformMode('scale');
          }
          break;
        case 'x':
          setSnapToGrid((prev) => !prev);
          break;
        case 'd':
          // Ctrl+D to duplicate selected model
          if ((e.ctrlKey || e.metaKey) && props.selectedModel3DId) {
            e.preventDefault();
            props.onModel3DDuplicate?.(props.selectedModel3DId);
          }
          break;
        case 'escape':
          props.onModel3DSelect?.(null);
          props.onTokenSelect(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [props]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
      {/* Transform toolbar */}
      <div className="absolute top-3 left-3 z-10">
        <Transform3DToolbar
          mode={transformMode}
          onModeChange={setTransformMode}
          hasSelection={!!props.selectedModel3DId}
          snapToGrid={snapToGrid}
          onSnapToggle={setSnapToGrid}
        />
      </div>

      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene {...props} transformMode={transformMode} snapToGrid={snapToGrid} />
        </Suspense>
      </Canvas>
    </div>
  );
}
