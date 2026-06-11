'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitPerson } from '../people/types';
import {
  eventTiming,
  type CafeNode,
  type CommunityNode,
  type EventNode,
  type WorldLayer,
  type WorldPerson,
  type WorldSelection,
} from './types';

type WorldOrbitPerson = OrbitPerson & WorldPerson;

type Props = {
  layer: WorldLayer;
  orbits: WorldOrbitPerson[];
  cafes: CafeNode[];
  events: EventNode[];
  communities: CommunityNode[];
  selectedId: string | null;
  onSelect: (selection: WorldSelection | null) => void;
};

const MAX_PEOPLE = 50;
const HEAT_COLORS: Record<string, string> = {
  TRENDING: '#fb923c',
  BUSY: '#f59e0b',
  POPULAR: '#facc15',
  NEW: '#22d3ee',
};

function spot(angle: number, radius: number, height: number): [number, number, number] {
  return [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
}

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
  person: WorldOrbitPerson;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [x, y, z] = spot(person.orbitAngle, person.orbitRadius, person.orbitHeight);
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

function CafeNodeMesh({
  cafe,
  selected,
  onSelect,
}: {
  cafe: CafeNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [x, y, z] = spot(cafe.angle, cafe.radius, cafe.height);
  const heatColor = cafe.heat ? HEAT_COLORS[cafe.heat] : null;
  const baseColor = heatColor ?? '#d97706';
  const trending = cafe.heat === 'TRENDING';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = trending
      ? 1 + Math.sin(clock.elapsedTime * 3.2) * 0.12
      : 1 + Math.sin(clock.elapsedTime * 1.4 + cafe.angle) * 0.04;
    const target = selected ? 1.4 : pulse;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
  });

  return (
    <group
      ref={ref}
      position={[x, y, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <mesh>
        <cylinderGeometry args={[0.3, 0.36, 0.22, 24]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={trending ? 0.9 : 0.4}
          roughness={0.35}
          metalness={0.5}
        />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial
          color="#fef3c7"
          emissive={baseColor}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 32]} />
        <meshBasicMaterial color={baseColor} transparent opacity={trending ? 0.5 : 0.2} />
      </mesh>
      {cafe.presentCount > 0 ? (
        <Html center distanceFactor={9} position={[0, 0.62, 0]} zIndexRange={[10, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-amber-200 backdrop-blur-sm">
            {cafe.presentCount}
          </div>
        </Html>
      ) : null}
    </group>
  );
}

function EventNodeMesh({
  event,
  selected,
  onSelect,
}: {
  event: EventNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [x, y, z] = spot(event.angle, event.radius, event.height);
  const timing = useMemo(() => eventTiming(event.startsAt, event.endsAt), [event]);
  const happeningNow = timing.state === 'now';
  // Pulse faster as the event gets closer.
  const pulseSpeed =
    timing.state === 'now' ? 4.5 : timing.state === 'soon' ? 3.2 : 1.6;
  const color = happeningNow ? '#f43f5e' : '#f472b6';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * pulseSpeed + event.angle) * 0.14;
    const target = selected ? 1.5 : pulse;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
    ref.current.rotation.y += 0.008;
  });

  return (
    <Float speed={1} floatIntensity={0.5}>
      <group position={[x, y, z]}>
        <mesh
          ref={ref}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <octahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={happeningNow ? 1.1 : 0.55}
            roughness={0.2}
            metalness={0.7}
          />
        </mesh>
        {happeningNow ? (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.36, 0.42, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.6} />
          </mesh>
        ) : null}
      </group>
    </Float>
  );
}

function CommunityNodeMesh({
  community,
  selected,
  onSelect,
}: {
  community: CommunityNode;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [x, y, z] = spot(community.angle, community.radius, community.height);
  const size = Math.min(0.16 + community.memberCount * 0.004, 0.3);
  const dots = Math.min(3 + Math.floor(community.memberCount / 10), 6);
  const color = '#c084fc';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * 0.4 + community.angle;
    const target = selected ? 1.45 : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
  });

  return (
    <Float speed={0.8} floatIntensity={0.3}>
      <group
        ref={ref}
        position={[x, y, z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <mesh>
          <sphereGeometry args={[size, 20, 20]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={community.activeNow > 0 ? 0.7 : 0.3}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        {Array.from({ length: dots }).map((_, i) => {
          const a = (i / dots) * Math.PI * 2;
          const r = size + 0.16;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial
                color="#e9d5ff"
                emissive={color}
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
}

function WorldScene({
  layer,
  orbits,
  cafes,
  events,
  communities,
  selectedId,
  onSelect,
}: Props) {
  const showPeople = layer === 'all' || layer === 'people';
  const showCafes = layer === 'all' || layer === 'cafes';
  const showEvents = layer === 'all' || layer === 'events';
  const showCommunities = layer === 'all' || layer === 'communities';
  const visiblePeople = useMemo(() => orbits.slice(0, MAX_PEOPLE), [orbits]);

  return (
    <>
      <color attach="background" args={['#030712']} />
      <fog attach="fog" args={['#030712', 12, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />
      <Stars radius={80} depth={40} count={3500} factor={3} saturation={0} fade speed={0.5} />
      {layer === 'all' ? (
        <Sparkles count={110} scale={14} size={2} speed={0.25} opacity={0.35} color="#818cf8" />
      ) : null}
      <UserCore />
      {showPeople
        ? visiblePeople.map((p) => (
            <PersonOrb
              key={p.id}
              person={p}
              selected={selectedId === p.id}
              onSelect={() =>
                onSelect(selectedId === p.id ? null : { kind: 'person', person: p })
              }
            />
          ))
        : null}
      {showCafes
        ? cafes.map((c) => (
            <CafeNodeMesh
              key={c.id}
              cafe={c}
              selected={selectedId === c.id}
              onSelect={() =>
                onSelect(selectedId === c.id ? null : { kind: 'cafe', cafe: c })
              }
            />
          ))
        : null}
      {showEvents
        ? events.map((e) => (
            <EventNodeMesh
              key={e.id}
              event={e}
              selected={selectedId === e.id}
              onSelect={() =>
                onSelect(selectedId === e.id ? null : { kind: 'event', event: e })
              }
            />
          ))
        : null}
      {showCommunities
        ? communities.map((c) => (
            <CommunityNodeMesh
              key={c.id}
              community={c}
              selected={selectedId === c.id}
              onSelect={() =>
                onSelect(
                  selectedId === c.id ? null : { kind: 'community', community: c },
                )
              }
            />
          ))
        : null}
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

export function WorldGalaxy(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, 3.5, 8], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <WorldScene {...props} />
    </Canvas>
  );
}
