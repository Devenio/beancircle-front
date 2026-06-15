'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, OrbitControls } from '@react-three/drei';
import { useTranslations } from 'next-intl';
import * as THREE from 'three';

type TableDef = {
  key: string;
  pos: [number, number, number];
  color: string;
  count: number;
};

const TABLES: TableDef[] = [
  { key: 'cafeTableStartups', pos: [-2.1, 0, 0.4], color: '#f0b860', count: 5 },
  { key: 'cafeTableDesign', pos: [2.0, 0, -0.6], color: '#7fcf9f', count: 3 },
  { key: 'cafeTableBooks', pos: [0.3, 0, 2.1], color: '#e9a08a', count: 4 },
  { key: 'cafeTableCoffee', pos: [-0.7, 0, -2.1], color: '#8ab6e0', count: 6 },
];

function Bean({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} scale={[0.16, 0.22, 0.16]} castShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color={color} roughness={0.5} />
    </mesh>
  );
}

function Table({
  table,
  label,
  selected,
  onSelect,
}: {
  table: TableDef;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const seats = Math.min(table.count, 5);
  return (
    <Float speed={selected ? 2 : 1} rotationIntensity={0} floatIntensity={selected ? 0.5 : 0.2}>
      <group
        position={table.pos}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* leg */}
        <mesh position={[0, 0.37, 0]}>
          <cylinderGeometry args={[0.1, 0.13, 0.75, 16]} />
          <meshStandardMaterial color="#3a2418" roughness={0.7} />
        </mesh>
        {/* tabletop */}
        <mesh position={[0, 0.76, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.72, 0.08, 32]} />
          <meshStandardMaterial color={selected ? table.color : '#6b4a32'} roughness={0.45} />
        </mesh>
        {/* mug */}
        <mesh position={[0.18, 0.86, 0.1]}>
          <cylinderGeometry args={[0.09, 0.08, 0.14, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        {/* seated beans */}
        {Array.from({ length: seats }).map((_, i) => {
          const a = (i / seats) * Math.PI * 2;
          return (
            <Bean
              key={i}
              position={[Math.cos(a) * 0.95, 0.55, Math.sin(a) * 0.95]}
              color={table.color}
            />
          );
        })}
        {selected && (
          <Html center position={[0, 1.7, 0]} distanceFactor={9}>
            <div className="pointer-events-none whitespace-nowrap rounded-xl border border-white/20 bg-[#1a0f0a]/85 px-3 py-1.5 text-center backdrop-blur-md">
              <p className="text-[13px] font-bold text-white">{label}</p>
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}

function Rig() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    // very gentle parallax follow of the pointer for a "living" feel
    if (!ref.current) return;
    const x = state.pointer.x * 0.15;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, x, 0.04);
  });
  return <group ref={ref} />;
}

export function CafeScene() {
  const t = useTranslations('onboarding');
  const [selected, setSelected] = useState<string>('cafeTableStartups');

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 3.4, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => setSelected('')}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 6, 3]} intensity={60} color="#ffcf8f" castShadow />
      <pointLight position={[-4, 3, -3]} intensity={25} color="#f0b860" />
      <fog attach="fog" args={['#160d08', 8, 16]} />

      <Rig />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color="#241712" roughness={0.9} />
      </mesh>

      {TABLES.map((table) => (
        <Table
          key={table.key}
          table={table}
          label={`${t(table.key)} · ${t('cafeTablePeople', { count: table.count })}`}
          selected={selected === table.key}
          onSelect={() => setSelected(table.key)}
        />
      ))}

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
