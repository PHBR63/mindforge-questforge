import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Center,
  useGLTF,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

interface Model3DViewerProps {
  modelUrl: string;
  onTransformChange?: (transform: {
    rotation: [number, number, number];
    scale: number;
  }) => void;
  initialRotation?: [number, number, number];
  initialScale?: number;
  showControls?: boolean;
  height?: string;
}

function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Carregando modelo...</span>
      </div>
    </Html>
  );
}

function ErrorDisplay({ error }: { error: string }) {
  return (
    <Html center>
      <div className="flex items-center gap-2 bg-destructive/90 backdrop-blur-sm px-4 py-2 rounded-lg text-destructive-foreground">
        <span className="text-sm">{error}</span>
      </div>
    </Html>
  );
}

interface ModelProps {
  url: string;
  rotation: [number, number, number];
  scale: number;
  autoRotate: boolean;
  selectedAnimation: string | null;
  onAnimationsLoaded?: (animations: string[]) => void;
}

function Model({
  url,
  rotation,
  scale,
  autoRotate,
  selectedAnimation,
  onAnimationsLoaded,
}: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const [mixer] = useState(() => new THREE.AnimationMixer(scene));

  // Clone the scene to avoid issues with reuse
  const clonedScene = scene.clone();

  // Report available animations
  useEffect(() => {
    if (animations.length > 0 && onAnimationsLoaded) {
      onAnimationsLoaded(animations.map((a) => a.name || `Animation ${animations.indexOf(a)}`));
    }
  }, [animations, onAnimationsLoaded]);

  // Handle animation
  useEffect(() => {
    if (!selectedAnimation || animations.length === 0) return;

    const clip = animations.find(
      (a) => a.name === selectedAnimation || `Animation ${animations.indexOf(a)}` === selectedAnimation
    );

    if (clip) {
      const action = mixer.clipAction(clip);
      action.reset().fadeIn(0.5).play();

      return () => {
        action.fadeOut(0.5);
      };
    }
  }, [selectedAnimation, animations, mixer]);

  // Update mixer
  useFrame((_, delta) => {
    mixer.update(delta);
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive
          object={clonedScene}
          scale={scale}
          rotation={rotation.map((r) => (r * Math.PI) / 180) as [number, number, number]}
        />
      </Center>
    </group>
  );
}

export function Model3DViewer({
  modelUrl,
  onTransformChange,
  initialRotation = [0, 0, 0],
  initialScale = 1,
  showControls = true,
  height = '400px',
}: Model3DViewerProps) {
  const [rotation, setRotation] = useState<[number, number, number]>(initialRotation);
  const [scale, setScale] = useState(initialScale);
  const [autoRotate, setAutoRotate] = useState(false);
  const [animations, setAnimations] = useState<string[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRotationChange = (axis: 0 | 1 | 2, value: number) => {
    const newRotation: [number, number, number] = [...rotation];
    newRotation[axis] = value;
    setRotation(newRotation);
    onTransformChange?.({ rotation: newRotation, scale });
  };

  const handleScaleChange = (value: number) => {
    setScale(value);
    onTransformChange?.({ rotation, scale: value });
  };

  const handleReset = () => {
    setRotation([0, 0, 0]);
    setScale(1);
    setAutoRotate(false);
    setSelectedAnimation(null);
    onTransformChange?.({ rotation: [0, 0, 0], scale: 1 });
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative rounded-lg overflow-hidden border border-border bg-gradient-to-b from-muted/50 to-muted"
        style={{ height }}
      >
        <Canvas shadows>
          <Suspense fallback={<LoadingSpinner />}>
            <PerspectiveCamera makeDefault position={[0, 2, 5]} fov={50} />
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={20}
            />

            <ambientLight intensity={0.5} />
            <directionalLight
              position={[5, 5, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            <directionalLight position={[-5, 3, -5]} intensity={0.3} />

            {error ? (
              <ErrorDisplay error={error} />
            ) : (
              <Model
                url={modelUrl}
                rotation={rotation}
                scale={scale}
                autoRotate={autoRotate}
                selectedAnimation={selectedAnimation}
                onAnimationsLoaded={setAnimations}
              />
            )}

            <ContactShadows
              position={[0, -0.5, 0]}
              opacity={0.4}
              scale={10}
              blur={2}
              far={4}
            />

            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      </div>

      {showControls && (
        <div className="space-y-4 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Transformações</h4>
            <div className="flex gap-2">
              <Button
                variant={autoRotate ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRotate(!autoRotate)}
              >
                {autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Escala: {scale.toFixed(2)}x</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleScaleChange(Math.max(0.1, scale - 0.1))}
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleScaleChange(Math.min(5, scale + 0.1))}
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Slider
              value={[scale]}
              onValueChange={([v]) => handleScaleChange(v)}
              min={0.1}
              max={5}
              step={0.05}
            />
          </div>

          {/* Rotation X */}
          <div className="space-y-2">
            <Label className="text-xs">Rotação X: {rotation[0]}°</Label>
            <Slider
              value={[rotation[0]]}
              onValueChange={([v]) => handleRotationChange(0, v)}
              min={-180}
              max={180}
              step={5}
            />
          </div>

          {/* Rotation Y */}
          <div className="space-y-2">
            <Label className="text-xs">Rotação Y: {rotation[1]}°</Label>
            <Slider
              value={[rotation[1]]}
              onValueChange={([v]) => handleRotationChange(1, v)}
              min={-180}
              max={180}
              step={5}
            />
          </div>

          {/* Rotation Z */}
          <div className="space-y-2">
            <Label className="text-xs">Rotação Z: {rotation[2]}°</Label>
            <Slider
              value={[rotation[2]]}
              onValueChange={([v]) => handleRotationChange(2, v)}
              min={-180}
              max={180}
              step={5}
            />
          </div>

          {/* Animations */}
          {animations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Animação</Label>
              <Select
                value={selectedAnimation || ''}
                onValueChange={(v) => setSelectedAnimation(v || null)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Selecione uma animação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {animations.map((anim) => (
                    <SelectItem key={anim} value={anim}>
                      {anim}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Preload hook for better UX
export function usePreload3DModel(url: string | null) {
  useEffect(() => {
    if (url) {
      useGLTF.preload(url);
    }
  }, [url]);
}
