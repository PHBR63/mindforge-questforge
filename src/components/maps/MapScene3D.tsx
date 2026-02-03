import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  Stars,
  Sky
} from '@react-three/drei';
import { Grid3D } from './Grid3D';
import { Token3D } from './Token3D';
import { Models3DRenderer } from './Models3DRenderer';
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
  environment?: 'day' | 'night' | 'dungeon';
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
  environment = 'dungeon',
}: MapScene3DProps) {
  const totalWidth = gridWidth * cellSize;
  const totalHeight = gridHeight * cellSize;
  
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera 
        makeDefault 
        position={[0, totalWidth * 0.8, totalHeight * 0.6]} 
        fov={50}
      />
      
      {/* Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={totalWidth * 2}
        maxPolarAngle={Math.PI / 2 - 0.1}
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
        onClick={() => onTokenSelect(null)}
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
          onClick={() => onTokenSelect(token.id)}
        />
      ))}

      {/* 3D Models */}
      {models3D.length > 0 && (
        <Models3DRenderer
          models={models3D}
          cellSize={cellSize}
          selectedModelId={selectedModel3DId || null}
          onModelSelect={onModel3DSelect || (() => {})}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
        />
      )}
      
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
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border">
      <Canvas shadows>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
