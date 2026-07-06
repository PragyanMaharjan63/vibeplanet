import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';

const FIELD_RADIUS = 55;
const COLORS = ['#eaf2ff', '#9fe8ff', '#dfe9ff'];

function randomPointOnDome() {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI * 0.55;
  return new THREE.Vector3(
    FIELD_RADIUS * Math.sin(phi) * Math.cos(theta),
    FIELD_RADIUS * Math.cos(phi),
    FIELD_RADIUS * Math.sin(phi) * Math.sin(theta)
  );
}

function ShootingStar({ initialDelay, color }) {
  const meshRef = useRef();
  const anim = useRef({
    phase: 'idle',
    elapsed: 0,
    waitTime: initialDelay,
    duration: 1,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(),
  });

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const a = anim.current;

    if (a.phase === 'idle') {
      a.elapsed += delta;
      if (a.elapsed >= a.waitTime) {
        a.start.copy(randomPointOnDome());
        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          -(0.25 + Math.random() * 0.5),
          Math.random() - 0.5
        ).normalize();
        a.end.copy(a.start).addScaledVector(dir, 16 + Math.random() * 18);
        a.duration = 0.6 + Math.random() * 0.7;
        a.elapsed = 0;
        a.phase = 'active';
        mesh.visible = true;
      }
      return;
    }

    a.elapsed += delta;
    const t = Math.min(a.elapsed / a.duration, 1);
    mesh.position.lerpVectors(a.start, a.end, t);

    if (t >= 1) {
      a.phase = 'idle';
      a.elapsed = 0;
      a.waitTime = 4 + Math.random() * 10;
      mesh.visible = false;
    }
  });

  return (
    <Trail width={2} length={6} color={color} attenuation={(t) => t * t} decay={3} local={false}>
      <mesh ref={meshRef} visible={false}>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </Trail>
  );
}

export default function ShootingStars({ count = 5 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        delay: i * 1.4 + Math.random() * 2,
        color: COLORS[i % COLORS.length],
      })),
    [count]
  );

  return (
    <>
      {stars.map((star) => (
        <ShootingStar key={star.id} initialDelay={star.delay} color={star.color} />
      ))}
    </>
  );
}
