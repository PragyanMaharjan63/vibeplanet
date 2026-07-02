import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import Planet from './Planet.jsx';
import MessageOrb from './MessageOrb.jsx';

export default function Scene({ messages }) {
  return (
    <Canvas camera={{ position: [0, 1.8, 7], fov: 50 }} dpr={[1, 2]}>
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', 14, 30]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 4, 5]} intensity={1.6} color="#dfe9ff" />
      <pointLight position={[-6, -2, -6]} intensity={0.5} color="#4a5fd0" />

      <Suspense fallback={null}>
        <Stars radius={70} depth={45} count={4000} factor={2.6} fade speed={0.4} />
        <Sparkles count={60} scale={10} size={1.6} speed={0.3} color="#a9c8ff" />
        <Planet />

        {messages.map((message, i) => {
          const angle = (i / Math.max(messages.length, 1)) * Math.PI * 2;
          const radius = 3.4 + (i % 3) * 0.4;
          const y = ((i % 5) - 2) * 0.45;
          return (
            <MessageOrb
              key={message._id}
              message={message}
              position={[radius * Math.cos(angle), y, radius * Math.sin(angle)]}
              speed={0.07 + (i % 4) * 0.02}
            />
          );
        })}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={14}
        autoRotate
        autoRotateSpeed={0.35}
        maxPolarAngle={Math.PI * 0.72}
        minPolarAngle={Math.PI * 0.22}
      />
    </Canvas>
  );
}
