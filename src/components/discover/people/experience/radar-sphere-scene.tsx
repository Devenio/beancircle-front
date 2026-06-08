'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useDeviceTilt } from '../hooks/use-device-tilt';
import type { ScanSignal } from '@/stores/meet-now-store';
import type { MeetNowStage } from '@/stores/meet-now-store';

type Props = {
  stage: MeetNowStage;
  signals: ScanSignal[];
  avatarUrl?: string | null;
  userName?: string | null;
  revealedCount: number;
};

const PARTICLE_COUNT = 320;

function RadarShaderSphere({ scanning }: { scanning: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScan: { value: 0 },
      uColor: { value: new THREE.Color('#34d399') },
      uGlow: { value: new THREE.Color('#818cf8') },
    }),
    [],
  );

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uScan;
        uniform vec3 uColor;
        uniform vec3 uGlow;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
          float wave = sin(length(vPos.xy) * 8.0 - uTime * 3.0) * 0.5 + 0.5;
          float scanRing = smoothstep(0.02, 0.0, abs(fract(length(vPos.xz) * 2.0 - uTime * 0.8) - 0.5));
          float pulse = uScan * scanRing * 0.9;
          vec3 col = mix(uColor, uGlow, fresnel * 0.6);
          float alpha = 0.12 + fresnel * 0.35 + wave * 0.08 + pulse;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
  }, [uniforms]);

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    uniforms.uScan.value = THREE.MathUtils.lerp(
      uniforms.uScan.value,
      scanning ? 1 : 0.3,
      0.04,
    );
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.15;
  });

  return (
    <mesh ref={ref} material={material}>
      <icosahedronGeometry args={[2.2, 4]} />
    </mesh>
  );
}

function WireframeShell() {
  const ref = useRef<THREE.LineSegments>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = -clock.elapsedTime * 0.08;
  });
  return (
    <lineSegments ref={ref}>
      <edgesGeometry args={[new THREE.IcosahedronGeometry(2.25, 2)]} />
      <lineBasicMaterial color="#34d399" transparent opacity={0.15} />
    </lineSegments>
  );
}

function InstancedParticles() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      r: 2.5 + Math.random() * 4,
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      speed: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    particles.forEach((p, i) => {
      const th = p.theta + t * p.speed * 0.1;
      const ph = p.phi + Math.sin(t * 0.3 + p.phase) * 0.05;
      const x = p.r * Math.sin(ph) * Math.cos(th);
      const y = p.r * Math.sin(ph) * Math.sin(th);
      const z = p.r * Math.cos(ph);
      dummy.position.set(x, y, z);
      const s = 0.02 + Math.sin(t * 2 + p.phase) * 0.008;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, PARTICLE_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#a5b4fc" transparent opacity={0.7} />
    </instancedMesh>
  );
}

function ScanPulseRings({ active }: { active: boolean }) {
  const rings = [0, 1, 2];
  return (
    <>
      {rings.map((i) => (
        <ScanRing key={i} index={i} active={active} />
      ))}
    </>
  );
}

function ScanRing({ index, active }: { index: number; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || !active) return;
    const cycle = ((clock.elapsedTime * 0.5 + index * 0.33) % 1);
    const scale = 0.5 + cycle * 3.5;
    ref.current.scale.setScalar(scale);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - cycle) * 0.35;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1, 64]} />
      <meshBasicMaterial color="#34d399" transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

function SignalNode({
  signal,
  visible,
}: {
  signal: ScanSignal;
  visible: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const t = Math.min(1, signal.distanceM / 5000);
  const angle = (signal.index * 2.399963) % (Math.PI * 2);
  const r = 1.5 + t * 3.5;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  const y = Math.sin(signal.index * 1.7) * 0.8;

  useFrame(({ clock }) => {
    if (!ref.current || !visible) return;
    const s = 1 + Math.sin(clock.elapsedTime * 4 + signal.index) * 0.2;
    ref.current.scale.setScalar(s);
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight intensity={1.5} distance={3} color="#fbbf24" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.22, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function UserAvatarCore({
  avatarUrl,
  name,
}: {
  avatarUrl?: string | null;
  name?: string | null;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.05;
    ref.current.scale.setScalar(s);
  });

  const initial = (name ?? '?').charAt(0).toUpperCase();

  return (
    <Float speed={1.5} floatIntensity={0.3}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial
          color="#064e3b"
          emissive="#34d399"
          emissiveIntensity={0.55}
          roughness={0.25}
          metalness={0.5}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.2} />
      </mesh>
      <Html center distanceFactor={6} style={{ pointerEvents: 'none' }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-14 rounded-full border-2 border-emerald-400/60 object-cover shadow-[0_0_24px_rgba(52,211,153,0.5)]"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full border-2 border-emerald-400/60 bg-emerald-900/80 text-lg font-bold text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.5)]">
            {initial}
          </div>
        )}
      </Html>
      <pointLight intensity={3} distance={6} color="#6ee7b7" />
    </Float>
  );
}

function CameraRig({ stage, revealedCount }: { stage: MeetNowStage; revealedCount: number }) {
  const { camera } = useThree();
  useFrame(() => {
    const targetZ = stage === 'complete' ? 10 + revealedCount * 0.15 : 7.5;
    const targetY = stage === 'complete' ? 4.5 : 3.2;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.03);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function SceneContent({ stage, signals, avatarUrl, userName, revealedCount }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const tilt = useDeviceTilt(stage !== 'idle' && stage !== 'complete');
  const scanning = stage === 'scanning' || stage === 'signals' || stage === 'revealing';

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      tilt.y * 0.25,
      0.06,
    );
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      -tilt.x * 0.25,
      0.06,
    );
  });

  return (
    <group ref={groupRef}>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 10, 22]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 4]} intensity={0.5} color="#c4b5fd" />
      <InstancedParticles />
      <RadarShaderSphere scanning={scanning} />
      <WireframeShell />
      <ScanPulseRings active={scanning} />
      <UserAvatarCore avatarUrl={avatarUrl} name={userName} />
      {signals.map((s) => (
        <SignalNode key={s.index} signal={s} visible={stage !== 'radar'} />
      ))}
      <CameraRig stage={stage} revealedCount={revealedCount} />
    </group>
  );
}

function AdaptiveDpr() {
  const { gl } = useThree();
  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    gl.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
  }, [gl]);
  return null;
}

export function RadarSphereScene(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, 3.2, 7.5], fov: 48 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      style={{ touchAction: 'none' }}
    >
      <AdaptiveDpr />
      <SceneContent {...props} />
    </Canvas>
  );
}
