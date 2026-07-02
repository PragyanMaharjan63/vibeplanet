import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';

export default function MessageOrb({ position, message, speed }) {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed;
    groupRef.current.position.x = position[0] * Math.cos(t) - position[2] * Math.sin(t);
    groupRef.current.position.z = position[0] * Math.sin(t) + position[2] * Math.cos(t);
  });

  return (
    <group ref={groupRef} position={position}>
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial
            color={message.color}
            emissive={message.color}
            emissiveIntensity={0.9}
            roughness={0.25}
          />
        </mesh>
        <Html distanceFactor={8} center>
          <div className="orb-card" style={{ '--orb-color': message.color }}>
            <span className="orb-card-name">{message.name}</span>
            <span className="orb-card-text">{message.text}</span>
          </div>
        </Html>
      </Float>
    </group>
  );
}
