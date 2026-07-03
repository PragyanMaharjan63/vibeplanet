import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Sparkles } from '@react-three/drei';
import Planet from './Planet.jsx';
import MessageOrb from './MessageOrb.jsx';
import SolarSystem from './SolarSystem.jsx';
import { getPlanet } from '../planets.js';

export default function Scene({ mode, selectedPlanet, messages, allMessages, onSelectPlanet }) {
  const config = getPlanet(selectedPlanet);
  const isSystem = mode === 'system';

  return (
    // Remounting on mode change gives each view its own fresh camera
    // position instead of inheriting wherever the other view's camera was.
    <Canvas
      key={mode}
      camera={isSystem ? { position: [0, 16, 26], fov: 55 } : { position: [0, 1.8, 7], fov: 50 }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', isSystem ? 30 : 14, isSystem ? 60 : 30]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 4, 5]} intensity={1.6} color="#dfe9ff" />
      <pointLight position={[-6, -2, -6]} intensity={0.5} color="#4a5fd0" />

      <Suspense fallback={null}>
        <Stars radius={80} depth={50} count={4000} factor={2.6} fade speed={0.4} />
        <Sparkles count={60} scale={12} size={1.6} speed={0.3} color="#a9c8ff" />

        {isSystem ? (
          <SolarSystem
            allMessages={allMessages}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={onSelectPlanet}
          />
        ) : (
          <>
            <Planet config={config} />
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
          </>
        )}
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={isSystem ? 8 : 4}
        maxDistance={isSystem ? 44 : 14}
        autoRotate={!isSystem}
        autoRotateSpeed={0.35}
        maxPolarAngle={isSystem ? Math.PI * 0.48 : Math.PI * 0.72}
        minPolarAngle={isSystem ? Math.PI * 0.08 : Math.PI * 0.22}
      />
    </Canvas>
  );
}
