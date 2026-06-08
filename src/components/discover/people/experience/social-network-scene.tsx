'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitPerson } from '../types';

type Props = {
  orbits: OrbitPerson[];
  selectedId: string | null;
  onSelect: (person: OrbitPerson | null) => void;
};

function sharedInterestCount(a: OrbitPerson, b: OrbitPerson) {
  const setB = new Set(b.sharedInterests);
  return a.sharedInterests.filter((i) => setB.has(i)).length;
}

function InterestConnections({ orbits }: { orbits: OrbitPerson[] }) {
  const lines = useMemo(() => {
    const result: { from: THREE.Vector3; to: THREE.Vector3; strength: number }[] = [];
    for (let i = 0; i < orbits.length; i++) {
      for (let j = i + 1; j < orbits.length; j++) {
        const shared = sharedInterestCount(orbits[i]!, orbits[j]!);
        if (shared < 1) continue;
        const a = orbits[i]!;
        const b = orbits[j]!;
        result.push({
          from: new THREE.Vector3(
            Math.cos(a.orbitAngle) * a.orbitRadius,
            a.orbitHeight,
            Math.sin(a.orbitAngle) * a.orbitRadius,
          ),
          to: new THREE.Vector3(
            Math.cos(b.orbitAngle) * b.orbitRadius,
            b.orbitHeight,
            Math.sin(b.orbitAngle) * b.orbitRadius,
          ),
          strength: shared,
        });
      }
    }
    return result;
  }, [orbits]);

  return (
    <>
      {lines.map((l, i) => (
        <Line
          key={i}
          points={[l.from, l.to]}
          color="#818cf8"
          lineWidth={0.5 + l.strength}
          transparent
          opacity={0.15 + l.strength * 0.12}
        />
      ))}
    </>
  );
}

function UserCore() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.5) * 0.04);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.38, 32, 32]} />
      <meshStandardMaterial
        color="#6ee7b7"
        emissive="#34d399"
        emissiveIntensity={1}
        roughness={0.2}
        metalness={0.7}
      />
      <pointLight intensity={2.5} distance={8} color="#34d399" />
    </mesh>
  );
}

function PersonNode({
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
  const color = person.lastActive === 'online' ? '#60a5fa' : '#c4b5fd';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2 + person.orbitAngle) * 0.06;
    ref.current.scale.setScalar(selected ? 1.5 : pulse);
  });

  return (
    <Float speed={1} floatIntensity={0.35}>
      <mesh
        ref={ref}
        position={[x, person.orbitHeight, z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={person.availability ? '#fbbf24' : color}
          emissiveIntensity={0.4 + person.glow}
          roughness={0.2}
          metalness={0.65}
        />
      </mesh>
    </Float>
  );
}

function NetworkScene({ orbits, selectedId, onSelect }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = clock.elapsedTime * 0.04;
  });

  return (
    <group ref={groupRef}>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 14, 30]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 5]} intensity={0.55} />
      <Stars radius={60} depth={30} count={2500} factor={2.5} saturation={0} fade speed={0.3} />
      <UserCore />
      <InterestConnections orbits={orbits} />
      {orbits.map((p) => (
        <PersonNode
          key={p.id}
          person={p}
          selected={selectedId === p.id}
          onSelect={() => onSelect(selectedId === p.id ? null : p)}
        />
      ))}
    </group>
  );
}

export function SocialNetworkScene(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, 4, 11], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <NetworkScene {...props} />
    </Canvas>
  );
}
