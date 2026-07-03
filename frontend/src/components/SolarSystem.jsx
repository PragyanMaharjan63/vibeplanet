import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PLANETS } from '../planets.js';

function Sun() {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.y += delta * 0.05;
  });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[1.4, 48, 48]} />
        <meshBasicMaterial color="#ffd27a" />
      </mesh>
      <mesh scale={1.35}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
      <pointLight color="#ffd27a" intensity={2.2} distance={40} decay={1.5} />
    </group>
  );
}

function OrbitRing({ radius }) {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <ringGeometry args={[radius - 0.015, radius + 0.015, 128]} />
      <meshBasicMaterial color="#3a4266" transparent opacity={0.35} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Moon({ color, baseAngle, orbitRadius }) {
  const ref = useRef();
  useFrame((state) => {
    const t = baseAngle + state.clock.elapsedTime * 0.6;
    ref.current.position.set(orbitRadius * Math.cos(t), 0, orbitRadius * Math.sin(t));
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
    </mesh>
  );
}

function OrbitingPlanet({ config, messageColors, selected, onSelect }) {
  const groupRef = useRef();
  const bodyRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);
  const bodyRadius = 0.28 + config.size * 0.16;

  useFrame((state, delta) => {
    angleRef.current += delta * config.orbitSpeed * 0.15;
    const x = config.sunDistance * Math.cos(angleRef.current);
    const z = config.sunDistance * Math.sin(angleRef.current);
    groupRef.current.position.set(x, 0, z);
    bodyRef.current.rotation.y += delta * config.rotationSpeed * 0.3;
  });

  const moons = useMemo(
    () =>
      messageColors
        .slice(0, 6)
        .map((color, i) => ({ color, angle: (i / Math.max(messageColors.length, 1)) * Math.PI * 2 })),
    [messageColors]
  );

  return (
    <group ref={groupRef}>
      <mesh
        ref={bodyRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(config.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[bodyRadius, 32, 32]} />
        <meshStandardMaterial
          color={config.color}
          emissive={selected ? config.glow : config.emissive}
          emissiveIntensity={selected ? 0.6 : 0.3}
          roughness={0.5}
        />
      </mesh>

      {config.hasRing && (
        <mesh rotation={[-Math.PI / 2.6, 0, Math.PI / 14]}>
          <ringGeometry args={[bodyRadius * 1.4, bodyRadius * 1.75, 48]} />
          <meshBasicMaterial color={config.ringColor} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      {moons.map((moon, i) => (
        <Moon key={i} color={moon.color} baseAngle={moon.angle} orbitRadius={bodyRadius * 2.4} />
      ))}

      {selected && (
        <mesh rotation-x={-Math.PI / 2} position-y={-bodyRadius - 0.02}>
          <ringGeometry args={[bodyRadius * 1.9, bodyRadius * 2.05, 48]} />
          <meshBasicMaterial color={config.glow} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export default function SolarSystem({ allMessages, selectedPlanet, onSelectPlanet }) {
  const grouped = useMemo(() => {
    const map = {};
    for (const m of allMessages) {
      const key = m.planet || 'earth';
      if (!map[key]) map[key] = [];
      map[key].push(m.color);
    }
    return map;
  }, [allMessages]);

  return (
    <group>
      <Sun />
      {PLANETS.map((config) => (
        <OrbitRing key={`ring-${config.id}`} radius={config.sunDistance} />
      ))}
      {PLANETS.map((config) => (
        <OrbitingPlanet
          key={config.id}
          config={config}
          messageColors={grouped[config.id] || []}
          selected={selectedPlanet === config.id}
          onSelect={onSelectPlanet}
        />
      ))}
    </group>
  );
}
