'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const CREMA = new THREE.Color('#e0a85a');
const CREAM = new THREE.Color('#f6ecd9');
const MOCHA = new THREE.Color('#d98a6a');

/** Soft round sprite for the point cloud (avoids square GL points). */
function useDiscTexture() {
  return useMemo(() => {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function Universe({ count, scrollRef }: { count: number; scrollRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const disc = useDiscTexture();
  const { camera } = useThree();

  // Distribute "people" nodes in a flattened sphere (a galaxy-ish disc).
  const { positions, colors, lineGeo } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.6) * 6.5;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3.2;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      pos.set([x, y, z], i * 3);
      pts.push(new THREE.Vector3(x, y, z));
      const c = CREAM.clone().lerp(Math.random() > 0.5 ? CREMA : MOCHA, Math.random());
      col.set([c.r, c.g, c.b], i * 3);
    }
    // Connect nearby nodes into a sparse network.
    const segs: number[] = [];
    for (let i = 0; i < count; i++) {
      let links = 0;
      for (let j = i + 1; j < count && links < 3; j++) {
        if (pts[i].distanceTo(pts[j]) < 2.1) {
          segs.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
          links++;
        }
      }
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(segs, 3));
    return { positions: pos, colors: col, lineGeo: lg };
  }, [count]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const scroll = scrollRef.current;
    // Gentle auto-rotation + scroll-driven tilt.
    group.current.rotation.y += delta * 0.05;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -0.25 + scroll * 0.8 + Math.sin(t * 0.2) * 0.04,
      0.05,
    );
    // Pointer parallax on the camera.
    const px = state.pointer.x * 1.6;
    const py = state.pointer.y * 1.0;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, px, 0.04);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, py, 0.04);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 12 - scroll * 2.5, 0.05);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color={CREMA}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.34}
          map={disc}
          vertexColors
          transparent
          alphaTest={0.02}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export default function ConnectionUniverse({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  // Lighter node count on small screens for 60fps on mobile.
  const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 64 : 130;
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 55 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <fog attach="fog" args={['#120a06', 10, 22]} />
      <Universe count={count} scrollRef={scrollRef} />
    </Canvas>
  );
}
