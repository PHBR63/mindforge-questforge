import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface Grid3DProps {
  width: number;
  height: number;
  cellSize: number;
  color?: string;
}

export function Grid3D({ width, height, cellSize, color = '#444466' }: Grid3DProps) {
  const lines = useMemo(() => {
    const linesArray: [THREE.Vector3, THREE.Vector3][] = [];
    
    const totalWidth = width * cellSize;
    const totalHeight = height * cellSize;
    const halfWidth = totalWidth / 2;
    const halfHeight = totalHeight / 2;
    
    // Vertical lines
    for (let x = 0; x <= width; x++) {
      const xPos = x * cellSize - halfWidth;
      linesArray.push([
        new THREE.Vector3(xPos, 0, -halfHeight),
        new THREE.Vector3(xPos, 0, halfHeight)
      ]);
    }
    
    // Horizontal lines
    for (let z = 0; z <= height; z++) {
      const zPos = z * cellSize - halfHeight;
      linesArray.push([
        new THREE.Vector3(-halfWidth, 0, zPos),
        new THREE.Vector3(halfWidth, 0, zPos)
      ]);
    }
    
    return linesArray;
  }, [width, height, cellSize]);

  return (
    <group>
      {lines.map((line, index) => (
        <Line
          key={index}
          points={line}
          color={color}
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
    </group>
  );
}
