import { useMemo } from 'react';
import * as THREE from 'three';
import { MapFloor, MapWall, MapWallOpening, MapLight, calculateWallAngle } from './wallTypes';

interface WallScene3DContentProps {
  floors: MapFloor[];
  walls: MapWall[];
  openings: MapWallOpening[];
  lights: MapLight[];
  activeFloorId: string | null;
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
}

function Wall3D({
  wall,
  floorHeight,
  floorElevation,
  openings,
  cellSize,
}: {
  wall: MapWall;
  floorHeight: number;
  floorElevation: number;
  openings: MapWallOpening[];
  cellSize: number;
}) {
  const geometry = useMemo(() => {
    const dx = wall.end_x - wall.start_x;
    const dy = wall.end_y - wall.start_y;
    const length = Math.sqrt(dx * dx + dy * dy) * cellSize;
    const height = wall.height;
    const thickness = wall.thickness * cellSize;

    // Create wall shape
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    shape.lineTo(length, height);
    shape.lineTo(0, height);
    shape.closePath();

    // Add holes for openings
    openings.forEach((opening) => {
      const pos = opening.position_along_wall * length;
      const halfWidth = (opening.width * cellSize) / 2;
      const holePath = new THREE.Path();
      holePath.moveTo(pos - halfWidth, opening.elevation);
      holePath.lineTo(pos + halfWidth, opening.elevation);
      holePath.lineTo(pos + halfWidth, opening.elevation + opening.height);
      holePath.lineTo(pos - halfWidth, opening.elevation + opening.height);
      holePath.closePath();
      shape.holes.push(holePath);
    });

    // Extrude
    const extrudeSettings = {
      depth: thickness,
      bevelEnabled: false,
    };

    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [wall, openings, cellSize]);

  const position = useMemo(() => {
    const angle = calculateWallAngle(wall);
    const midX = ((wall.start_x + wall.end_x) / 2) * cellSize;
    const midZ = ((wall.start_y + wall.end_y) / 2) * cellSize;
    return new THREE.Vector3(
      wall.start_x * cellSize - midX,
      floorElevation,
      wall.start_y * cellSize - midZ
    );
  }, [wall, cellSize, floorElevation]);

  const rotation = useMemo(() => {
    const angle = calculateWallAngle(wall);
    return new THREE.Euler(-Math.PI / 2, 0, -angle);
  }, [wall]);

  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={wall.color}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function Opening3D({
  wall,
  opening,
  floorElevation,
  cellSize,
}: {
  wall: MapWall;
  opening: MapWallOpening;
  floorElevation: number;
  cellSize: number;
}) {
  const position = useMemo(() => {
    const pos = opening.position_along_wall;
    const x = (wall.start_x + (wall.end_x - wall.start_x) * pos) * cellSize;
    const z = (wall.start_y + (wall.end_y - wall.start_y) * pos) * cellSize;
    const y = floorElevation + opening.elevation + opening.height / 2;
    return new THREE.Vector3(x, y, z);
  }, [wall, opening, floorElevation, cellSize]);

  const rotation = useMemo(() => {
    const angle = calculateWallAngle(wall);
    return new THREE.Euler(0, -angle, 0);
  }, [wall]);

  if (opening.opening_type === 'door') {
    // Render door frame
    return (
      <group position={position} rotation={rotation}>
        {/* Door frame */}
        <mesh castShadow>
          <boxGeometry args={[opening.width * cellSize, opening.height, 0.05]} />
          <meshStandardMaterial color={opening.color || '#8B4513'} />
        </mesh>
        {/* Door panel (if closed) */}
        {!opening.is_open && (
          <mesh position={[0, 0, 0.03]} castShadow>
            <boxGeometry args={[opening.width * cellSize * 0.95, opening.height * 0.98, 0.04]} />
            <meshStandardMaterial color={opening.color || '#654321'} />
          </mesh>
        )}
      </group>
    );
  }

  if (opening.opening_type === 'window') {
    return (
      <group position={position} rotation={rotation}>
        {/* Window frame */}
        <mesh castShadow>
          <boxGeometry args={[opening.width * cellSize, opening.height, 0.08]} />
          <meshStandardMaterial color={opening.color || '#3d3d3d'} />
        </mesh>
        {/* Glass */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[opening.width * cellSize * 0.9, opening.height * 0.9, 0.02]} />
          <meshStandardMaterial
            color="#87CEEB"
            transparent
            opacity={0.4}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      </group>
    );
  }

  return null;
}

function Light3D({
  light,
  floorElevation,
  cellSize,
}: {
  light: MapLight;
  floorElevation: number;
  cellSize: number;
}) {
  const position = useMemo(() => {
    return new THREE.Vector3(
      light.position_x * cellSize,
      floorElevation + light.position_z,
      light.position_y * cellSize
    );
  }, [light, floorElevation, cellSize]);

  return (
    <group position={position}>
      {light.light_type === 'point' && (
        <>
          <pointLight
            color={light.color}
            intensity={light.intensity}
            distance={light.range * cellSize}
            castShadow={light.cast_shadows}
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />
          {/* Light fixture */}
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={light.color}
              emissive={light.color}
              emissiveIntensity={1}
            />
          </mesh>
        </>
      )}

      {light.light_type === 'spot' && (
        <>
          <spotLight
            color={light.color}
            intensity={light.intensity}
            distance={light.range * cellSize}
            angle={Math.PI / 6}
            penumbra={0.5}
            castShadow={light.cast_shadows}
          />
          {/* Light fixture */}
          <mesh>
            <coneGeometry args={[0.1, 0.15, 8]} />
            <meshStandardMaterial
              color={light.color}
              emissive={light.color}
              emissiveIntensity={0.5}
            />
          </mesh>
        </>
      )}

      {light.light_type === 'ambient' && (
        <hemisphereLight
          color={light.color}
          groundColor="#444444"
          intensity={light.intensity}
        />
      )}
    </group>
  );
}

export function WallScene3DContent({
  floors,
  walls,
  openings,
  lights,
  activeFloorId,
  cellSize,
  gridWidth,
  gridHeight,
}: WallScene3DContentProps) {
  // Calculate floor elevations
  const floorElevations = useMemo(() => {
    const sortedFloors = [...floors].sort((a, b) => a.floor_number - b.floor_number);
    const elevations: Record<string, number> = {};
    let currentElevation = 0;

    sortedFloors.forEach((floor) => {
      if (floor.floor_number < 0) {
        currentElevation = floor.floor_number * floor.height;
      }
      elevations[floor.id] = currentElevation;
      currentElevation += floor.height;
    });

    return elevations;
  }, [floors]);

  // Center offset
  const centerX = (gridWidth * cellSize) / 2;
  const centerZ = (gridHeight * cellSize) / 2;

  return (
    <group position={[-centerX, 0, -centerZ]}>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow>
        <planeGeometry args={[gridWidth * cellSize + 10, gridHeight * cellSize + 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Render floors */}
      {floors.map((floor) => {
        if (!floor.is_visible) return null;
        const elevation = floorElevations[floor.id] || 0;
        const floorWalls = walls.filter((w) => w.floor_id === floor.id);
        const floorLights = lights.filter((l) => l.floor_id === floor.id);

        return (
          <group key={floor.id}>
            {/* Floor surface */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[centerX, elevation + 0.01, centerZ]}
              receiveShadow
            >
              <planeGeometry args={[gridWidth * cellSize, gridHeight * cellSize]} />
              <meshStandardMaterial
                color={floor.id === activeFloorId ? '#2a2a4e' : '#1a1a2e'}
                transparent
                opacity={floor.id === activeFloorId ? 1 : 0.5}
              />
            </mesh>

            {/* Walls */}
            {floorWalls.map((wall) => {
              if (!wall.is_visible) return null;
              const wallOpenings = openings.filter((o) => o.wall_id === wall.id);

              return (
                <group key={wall.id}>
                  <Wall3D
                    wall={wall}
                    floorHeight={floor.height}
                    floorElevation={elevation}
                    openings={wallOpenings}
                    cellSize={cellSize}
                  />
                  {wallOpenings.map((opening) => (
                    <Opening3D
                      key={opening.id}
                      wall={wall}
                      opening={opening}
                      floorElevation={elevation}
                      cellSize={cellSize}
                    />
                  ))}
                </group>
              );
            })}

            {/* Lights */}
            {floorLights.map((light) => {
              if (!light.is_visible) return null;
              return (
                <Light3D
                  key={light.id}
                  light={light}
                  floorElevation={elevation}
                  cellSize={cellSize}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
