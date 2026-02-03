import { Suspense, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Map3DModel } from './model3DTypes';

interface Model3DInstanceProps {
  model: Map3DModel;
  cellSize: number;
  isSelected: boolean;
  onClick: () => void;
}

function Model3DInstance({ model, cellSize, isSelected, onClick }: Model3DInstanceProps) {
  const { scene } = useGLTF(model.file_url);

  const position = useMemo<[number, number, number]>(() => {
    return [
      model.position_x * cellSize,
      model.position_z * cellSize, // Z in data becomes Y in 3D
      model.position_y * cellSize, // Y in data becomes Z in 3D
    ];
  }, [model.position_x, model.position_y, model.position_z, cellSize]);

  const rotation = useMemo<[number, number, number]>(() => {
    return [
      (model.rotation_x * Math.PI) / 180,
      (model.rotation_y * Math.PI) / 180,
      (model.rotation_z * Math.PI) / 180,
    ];
  }, [model.rotation_x, model.rotation_y, model.rotation_z]);

  // Clone scene to allow multiple instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <group position={position} rotation={rotation} scale={model.scale} onClick={onClick}>
      <primitive object={clonedScene} />
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function ModelFallback() {
  return (
    <Html center>
      <div className="bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
        Carregando...
      </div>
    </Html>
  );
}

interface Models3DRendererProps {
  models: Map3DModel[];
  cellSize: number;
  selectedModelId: string | null;
  onModelSelect: (modelId: string | null) => void;
  gridWidth: number;
  gridHeight: number;
}

export function Models3DRenderer({
  models,
  cellSize,
  selectedModelId,
  onModelSelect,
  gridWidth,
  gridHeight,
}: Models3DRendererProps) {
  // Center offset
  const centerX = (gridWidth * cellSize) / 2;
  const centerZ = (gridHeight * cellSize) / 2;

  const visibleModels = models.filter((m) => m.is_visible);

  return (
    <group position={[-centerX, 0, -centerZ]}>
      {visibleModels.map((model) => (
        <Suspense key={model.id} fallback={<ModelFallback />}>
          <Model3DInstance
            model={model}
            cellSize={cellSize}
            isSelected={selectedModelId === model.id}
            onClick={() => onModelSelect(model.id)}
          />
        </Suspense>
      ))}
    </group>
  );
}

// Preload all models for better performance
export function usePreloadModels(models: Map3DModel[]) {
  useMemo(() => {
    models.forEach((model) => {
      if (model.file_url) {
        useGLTF.preload(model.file_url);
      }
    });
  }, [models]);
}
