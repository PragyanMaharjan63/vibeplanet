import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const RING_TILT = [-Math.PI / 2.6, 0, Math.PI / 14];

export default function Planet() {
  const planetRef = useRef();
  const ringsRef = useRef();

  useFrame((state, delta) => {
    planetRef.current.rotation.y += delta * 0.12;
    ringsRef.current.rotation.z += delta * 0.02;
  });

  return (
    <group>
      {/* Planet body */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.35, 64, 64]} />
        <meshStandardMaterial
          color="#3b4a8f"
          emissive="#0b1030"
          roughness={0.55}
          metalness={0.35}
        />
      </mesh>

      {/* Atmosphere glow — slightly larger backside sphere */}
      <mesh scale={1.12}>
        <sphereGeometry args={[1.35, 48, 48]} />
        <meshBasicMaterial
          color="#6fb7ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[1.35, 48, 48]} />
        <meshBasicMaterial
          color="#8fd0ff"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Ring system */}
      <group ref={ringsRef} rotation={RING_TILT}>
        <mesh>
          <ringGeometry args={[1.85, 2.5, 96]} />
          <meshBasicMaterial
            color="#9fb4e8"
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[2.55, 2.72, 96]} />
          <meshBasicMaterial
            color="#c3d3f7"
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
