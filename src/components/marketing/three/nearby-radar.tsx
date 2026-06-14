'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const CREMA = '#c8853c';
const AMBER = '#f0b860';

function Radar() {
  const sweep = useRef<THREE.Mesh>(null);
  const people = useRef<THREE.Points>(null);
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const disc = useMemo(() => {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }, []);

  const positions = useMemo(() => {
    const n = 22;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.2 + Math.random() * 4.4;
      const a = Math.random() * Math.PI * 2;
      arr.set([Math.cos(a) * r, 0.05, Math.sin(a) * r], i * 3);
    }
    return arr;
  }, []);

  const rings = useMemo(() => [1.6, 3, 4.5, 5.8], []);

  useFrame((state, delta) => {
    if (sweep.current) sweep.current.rotation.z -= delta * 0.9;
    if (people.current) {
      const m = people.current.material as THREE.PointsMaterial;
      m.size = 0.42 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
    }
    if (group.current) {
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, state.pointer.x * 0.25, 0.05);
    }
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.pointer.x * 1.1, 0.04);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group} rotation={[-1.05, 0, 0]}>
      {rings.map((r) => (
        <mesh key={r} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[r - 0.012, r + 0.012, 96]} />
          <meshBasicMaterial color={CREMA} transparent opacity={0.28} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* cross hairs */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 0.07, 24]} />
        <meshBasicMaterial color={AMBER} />
      </mesh>

      {/* rotating sweep wedge */}
      <mesh ref={sweep} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.8, 48, 0, 0.7]} />
        <meshBasicMaterial
          color={AMBER}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <points ref={people}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.44}
          map={disc}
          color={AMBER}
          transparent
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function NearbyRadar() {
  return (
    <Canvas
      camera={{ position: [0, 6.5, 7], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <AdaptiveDpr pixelated />
      <Radar />
    </Canvas>
  );
}
