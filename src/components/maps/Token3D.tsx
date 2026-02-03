import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MapToken, TOKEN_TYPES } from './types';

interface Token3DProps {
  token: MapToken;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  isSelected: boolean;
  onClick: () => void;
}

export function Token3D({ 
  token, 
  gridWidth, 
  gridHeight, 
  cellSize, 
  isSelected, 
  onClick 
}: Token3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const tokenType = TOKEN_TYPES.find(t => t.value === token.token_type);
  const color = token.color || tokenType?.color || '#ef4444';
  const size = (token.size || 1) * cellSize;
  
  // Calculate position - center the grid
  const halfWidth = (gridWidth * cellSize) / 2;
  const halfHeight = (gridHeight * cellSize) / 2;
  const x = token.position_x * cellSize + size / 2 - halfWidth;
  const z = token.position_y * cellSize + size / 2 - halfHeight;
  
  // Animate selected token
  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onClick();
  };

  if (!token.is_visible) return null;

  return (
    <group position={[x, 0, z]}>
      {/* Token base - cylinder */}
      <Cylinder
        ref={meshRef}
        args={[size / 2 - 0.2, size / 2 - 0.1, 0.8, 32]}
        position={[0, 0.4, 0]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={color}
          emissive={isSelected || hovered ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0}
          metalness={0.3}
          roughness={0.7}
        />
      </Cylinder>
      
      {/* Token top ring for selected */}
      {isSelected && (
        <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size / 2 - 0.3, size / 2 - 0.1, 32]} />
          <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Token initial letter */}
      <Text
        position={[0, 0.85, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={size * 0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/Inter-Bold.woff"
      >
        {token.name.charAt(0).toUpperCase()}
      </Text>
      
      {/* Floating name on hover */}
      {hovered && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {token.name}
        </Text>
      )}
      
      {/* Shadow on the ground */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size / 2, 32]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}
