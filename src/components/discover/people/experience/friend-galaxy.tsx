'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { ActivityCircle, OrbitPerson } from '../types';

type Props = {
  orbits: OrbitPerson[];
  activities: ActivityCircle[];
  selectedId: string | null;
  onSelect: (person: OrbitPerson | null) => void;
};

function UserCore() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.06;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshStandardMaterial
        color="#6ee7b7"
        emissive="#34d399"
        emissiveIntensity={1.2}
        roughness={0.2}
        metalness={0.8}
      />
      <pointLight intensity={2} distance={8} color="#34d399" />
    </mesh>
  );
}

function PersonOrb({
  person,
  selected,
  onSelect,
}: {
  person: OrbitPerson;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const x = Math.cos(person.orbitAngle) * person.orbitRadius;
  const z = Math.sin(person.orbitAngle) * person.orbitRadius;
  const y = person.orbitHeight;
  const color = person.lastActive === 'online' ? '#60a5fa' : '#a78bfa';
  const emissive = person.availability ? '#fbbf24' : color;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.5 + person.orbitAngle) * 0.08;
    const target = selected ? 1.55 : pulse;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <mesh
        ref={ref}
        position={[x, y, z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.35 + person.glow}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>
      <mesh position={[x, y - 0.35, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </Float>
  );
}

function ActivityOrb({
  activity,
  index,
  total,
}: {
  activity: ActivityCircle;
  index: number;
  total: number;
}) {
  const angle = (index / total) * Math.PI * 2 + 0.5;
  const r = 6.2;
  return (
    <Float speed={0.8} floatIntensity={0.3}>
      <mesh position={[Math.cos(angle) * r, 0.8 + (index % 3) * 0.3, Math.sin(angle) * r]}>
        <icosahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color="#f472b6"
          emissive="#ec4899"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
    </Float>
  );
}

function GalaxyScene({ orbits, activities, selectedId, onSelect }: Props) {
  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 12, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />
      <Stars radius={80} depth={40} count={4000} factor={3} saturation={0} fade speed={0.5} />
      <Sparkles count={120} scale={14} size={2} speed={0.25} opacity={0.35} color="#818cf8" />
      <UserCore />
      {orbits.map((p) => (
        <PersonOrb
          key={p.id}
          person={p}
          selected={selectedId === p.id}
          onSelect={() => onSelect(selectedId === p.id ? null : p)}
        />
      ))}
      {activities.map((a, i) => (
        <ActivityOrb key={a.id} activity={a} index={i} total={activities.length} />
      ))}
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={16}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
      />
    </>
  );
}

export function FriendGalaxy(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, 3.5, 8], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <GalaxyScene {...props} />
    </Canvas>
  );
}
