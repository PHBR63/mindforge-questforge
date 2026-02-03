import { useRef, useEffect, useState, useMemo } from 'react';
import { useGLTF, TransformControls, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Map3DModel } from './model3DTypes';

type TransformMode = 'translate' | 'rotate' | 'scale';

interface TransformableModel3DProps {
  model: Map3DModel;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  isSelected: boolean;
  transformMode: TransformMode;
  snapToGrid: boolean;
  onSelect: () => void;
  onTransformEnd: (updates: Partial<Map3DModel>) => void;
  onAnimationsFound?: (animations: string[]) => void;
}

export function TransformableModel3D({
  model,
  cellSize,
  gridWidth,
  gridHeight,
  isSelected,
  transformMode,
  snapToGrid,
  onSelect,
  onTransformEnd,
  onAnimationsFound,
}: TransformableModel3DProps) {
  const { scene, animations } = useGLTF(model.file_url);
  const groupRef = useRef<THREE.Group>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [mixer] = useState(() => new THREE.AnimationMixer(scene));
  const [currentAction, setCurrentAction] = useState<THREE.AnimationAction | null>(null);

  // Center offset
  const centerX = (gridWidth * cellSize) / 2;
  const centerZ = (gridHeight * cellSize) / 2;

  const position = useMemo<[number, number, number]>(() => {
    return [
      model.position_x * cellSize - centerX,
      model.position_z * cellSize,
      model.position_y * cellSize - centerZ,
    ];
  }, [model.position_x, model.position_y, model.position_z, cellSize, centerX, centerZ]);

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

  // Report available animations
  useEffect(() => {
    if (animations.length > 0 && onAnimationsFound) {
      const animNames = animations.map((a, i) => a.name || `Animation ${i + 1}`);
      onAnimationsFound(animNames);
    }
  }, [animations, onAnimationsFound]);

  // Handle animation playback
  useEffect(() => {
    if (!model.animation_name || animations.length === 0) {
      if (currentAction) {
        currentAction.fadeOut(0.3);
        setCurrentAction(null);
      }
      return;
    }

    const clip = animations.find(
      (a, i) => a.name === model.animation_name || `Animation ${i + 1}` === model.animation_name
    );

    if (clip) {
      const action = mixer.clipAction(clip);
      
      if (model.animation_playing) {
        action.reset().fadeIn(0.3).play();
        setCurrentAction(action);
      } else {
        action.paused = true;
        action.play();
        setCurrentAction(action);
      }

      return () => {
        action.fadeOut(0.3);
      };
    }
  }, [model.animation_name, model.animation_playing, animations, mixer]);

  // Update animation mixer
  useFrame((_, delta) => {
    if (model.animation_playing) {
      mixer.update(delta);
    }
  });

  const handleTransformEnd = () => {
    if (!groupRef.current) return;
    setIsTransforming(false);

    const pos = groupRef.current.position;
    const rot = groupRef.current.rotation;
    const scl = groupRef.current.scale;

    // Convert back to model coordinates
    let newX = (pos.x + centerX) / cellSize;
    let newY = (pos.z + centerZ) / cellSize;
    let newZ = pos.y / cellSize;

    // Apply snap to grid if enabled
    if (snapToGrid) {
      newX = Math.round(newX);
      newY = Math.round(newY);
      newZ = Math.round(newZ * 2) / 2; // Snap to 0.5 increments for height
    }

    const newRotX = (rot.x * 180) / Math.PI;
    const newRotY = (rot.y * 180) / Math.PI;
    const newRotZ = (rot.z * 180) / Math.PI;

    // Use uniform scale (average of x, y, z)
    const newScale = (scl.x + scl.y + scl.z) / 3;

    // Snap rotation to 15-degree increments if snap enabled
    const snapRotation = (r: number) => (snapToGrid ? Math.round(r / 15) * 15 : Math.round(r));

    onTransformEnd({
      position_x: Math.round(newX * 100) / 100,
      position_y: Math.round(newY * 100) / 100,
      position_z: Math.round(newZ * 100) / 100,
      rotation_x: snapRotation(newRotX),
      rotation_y: snapRotation(newRotY),
      rotation_z: snapRotation(newRotZ),
      scale: Math.round(newScale * 100) / 100,
    });
  };

  return (
    <group>
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={model.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <primitive object={clonedScene} />

        {/* Selection indicator when not transforming */}
        {isSelected && !isTransforming && (
          <mesh>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} wireframe />
          </mesh>
        )}

        {/* Animation indicator */}
        {model.animation_playing && (
          <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="flex items-center gap-1 bg-green-500/80 px-2 py-0.5 rounded text-[10px] text-white">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Animando
            </div>
          </Html>
        )}

        {/* Name label */}
        {isSelected && (
          <Html
            position={[0, 1.5, 0]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-foreground whitespace-nowrap border border-primary">
              {model.name}
              {snapToGrid && <span className="ml-1 text-muted-foreground">(Snap)</span>}
            </div>
          </Html>
        )}
      </group>

      {/* Transform controls */}
      {isSelected && groupRef.current && (
        <TransformControls
          object={groupRef.current}
          mode={transformMode}
          size={0.7}
          translationSnap={snapToGrid ? cellSize : undefined}
          rotationSnap={snapToGrid ? Math.PI / 12 : undefined}
          scaleSnap={snapToGrid ? 0.25 : undefined}
          onMouseDown={() => setIsTransforming(true)}
          onMouseUp={handleTransformEnd}
        />
      )}
    </group>
  );
}

function ModelLoadingFallback() {
  return (
    <Html center>
      <div className="bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    </Html>
  );
}

function ModelErrorFallback({ name }: { name: string }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#ef4444" wireframe />
      </mesh>
      <Html center position={[0, 1, 0]}>
        <div className="bg-destructive/80 px-2 py-1 rounded text-xs text-destructive-foreground">
          Error: {name}
        </div>
      </Html>
    </group>
  );
}

export { ModelLoadingFallback, ModelErrorFallback };
