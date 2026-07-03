import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RING_TILT = [-Math.PI / 2.6, 0, Math.PI / 14];
const BASE_RADIUS = 1.1;

export default function Planet({ config }) {
  const planetRef = useRef();
  const ringsRef = useRef();
  const radius = BASE_RADIUS * config.size;

  useFrame((state, delta) => {
    planetRef.current.rotation.y += delta * config.rotationSpeed * 0.24;
    if (ringsRef.current) ringsRef.current.rotation.z += delta * 0.02;
  });

  return (
    <group>
      {/* Planet body */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.emissive}
          roughness={0.55}
          metalness={0.35}
        />
      </mesh>

      {/* Atmosphere glow — slightly larger backside sphere */}
      <mesh scale={1.12}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={config.glow} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial color={config.glow} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      {/* Ring system */}
      {config.hasRing && (
        <group ref={ringsRef} rotation={RING_TILT}>
          <mesh>
            <ringGeometry args={[radius * 1.37, radius * 1.85, 96]} />
            <meshBasicMaterial
              color={config.ringColor}
              transparent
              opacity={0.22}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[radius * 1.89, radius * 2.01, 96]} />
            <meshBasicMaterial
              color={config.ringColor}
              transparent
              opacity={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
