"use client";

import { SpecCategory } from "@/domain/models";
import { useOrbitStore } from "@/features/visualization/state/useOrbitStore";
import { Html } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { BufferGeometry, Color, Group, Points, Vector3 } from "three";

const PARTICLE_POSITIONS = (() => {
  const arr = new Float32Array(300 * 3);
  let seed = 42;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return ((seed < 0 ? ~seed + 1 : seed) % 1000) / 1000;
  };
  for (let i = 0; i < 300; i++) {
    arr[i * 3 + 0] = (rand() - 0.5) * 12;
    arr[i * 3 + 1] = (rand() - 0.5) * 12;
    arr[i * 3 + 2] = (rand() - 0.5) * 12;
  }
  return arr;
})();

function ParticleField() {
  const { speedMultiplier } = useOrbitStore();
  const pointsRef = useRef<Points>(null);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const rot = delta * 0.1 * speedMultiplier;
    pointsRef.current.rotation.y += rot;
    pointsRef.current.rotation.x += rot * 0.3;
  });

  return (
    <points ref={pointsRef} positions={PARTICLE_POSITIONS}>
      {/* @ts-expect-error three typings */}
      <pointsMaterial size={0.06} color={new Color("#67e8f9").convertSRGBToLinear()} transparent opacity={0.6} />
    </points>
  );
}

function SpecCardHtml({ category }: { category: SpecCategory }) {
  return (
    <div className="w-44 rounded-xl border border-white/12 bg-slate-900/85 p-2.5 text-xs shadow-xl backdrop-blur">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-slate-400">
        <span>{category.name}</span>
        <span className="rounded-full bg-cyan-500/12 px-2 py-0.5 text-[10px] text-cyan-200">Specs</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-100">{category.summary}</p>
      <ul className="mt-2 flex flex-col gap-1 text-[11px] text-slate-400">
        {category.specs.slice(0, 3).map((spec) => (
          <li key={spec.key} className="flex items-center justify-between">
            <span>{spec.label}</span>
            <span className="text-slate-200">
              {spec.value}
              {spec.unit ? ` ${spec.unit}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-slate-500">Hover a planet to inspect specs.</p>
    </div>
  );
}

type OrbitNode = {
  category: SpecCategory;
  radius: number;
  flatten: number;
  phase: number;
  depth: number;
  speed: number;
  color: string;
};

function ellipsePoints(a: number, b: number, segments = 120) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) {
    return [new Vector3(0, 0, 0), new Vector3(0, 0, 0)];
  }
  const safeSegments = Math.max(8, segments);
  const pts: Vector3[] = [];
  for (let i = 0; i <= safeSegments; i += 1) {
    const t = (i / safeSegments) * Math.PI * 2;
    pts.push(new Vector3(a * Math.cos(t), b * Math.sin(t), 0));
  }
  return pts;
}

function OrbitRing({ rx, ry }: { rx: number; ry: number }) {
  const geometryRef = useRef<BufferGeometry>(null);
  const points = useMemo(() => ellipsePoints(rx, ry), [rx, ry]);

  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.setFromPoints(points);
    }
  }, [points]);

  if (!Number.isFinite(rx) || !Number.isFinite(ry) || rx <= 0 || ry <= 0) return null;
  return (
    <lineLoop>
      <bufferGeometry ref={geometryRef} />
      <lineBasicMaterial color="#94a3b8" transparent opacity={0.6} />
    </lineLoop>
  );
}

function Planetarium({ categories }: { categories: SpecCategory[] }) {
  const { speedMultiplier, ellipse } = useOrbitStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groupRef = useRef<Group>(null);
  const clockRef = useRef(0);
  const pausedAnglesRef = useRef<Partial<Record<string, number>>>({});
  const orbitNodes = useMemo<OrbitNode[]>(() => {
    const safeEllipse = Number.isFinite(ellipse) ? ellipse : 0.8;
    const clampPositive = (val: number, fallback: number) => (Number.isFinite(val) && val > 0 ? val : fallback);
    const palette = ["#38bdf8", "#a855f7", "#22d3ee", "#60a5fa", "#f472b6", "#34d399"];
    const safeCategories = (categories ?? []).filter((c): c is SpecCategory => !!c);
    return safeCategories.map((category, index) => {
      const baseRadius = 4.2;
      const spacing = 0.9;
      const radius = clampPositive(baseRadius + index * spacing, baseRadius);
      const flatten = clampPositive((0.55 + (index % 3) * 0.06) * safeEllipse, 0.6);
      const phase = ((index * 0.7 + (category.orbitHint?.phase ?? 0) / 90) % (Math.PI * 2)) || 0;
      const depth = clampPositive(Math.abs(((index % 5) - 2) * 0.9), 0.1) * (index % 2 === 0 ? 1 : -1);
      const speed = clampPositive(0.18 + index * 0.035, 0.18);
      const color = palette[index % palette.length];
      return { category, radius, flatten, phase, depth, speed, color };
    }).filter(
      (node) =>
        Number.isFinite(node.radius) &&
        Number.isFinite(node.flatten) &&
        node.radius > 0 &&
        node.flatten > 0,
    );
  }, [categories, ellipse]);

  useFrame((state, delta) => {
    clockRef.current += delta * speedMultiplier;
    const t = clockRef.current;
    const g = groupRef.current;
    if (!g) return;
    orbitNodes.forEach((node, i) => {
      const child = g.children[i] as Group | undefined;
      if (!child) return;
      const planetMesh = child.children[1];
      const runningAngle = t * node.speed + node.phase;
      if (hoveredId === node.category.id && pausedAnglesRef.current[node.category.id] === undefined) {
        pausedAnglesRef.current[node.category.id] = runningAngle;
      }
      if (hoveredId !== node.category.id && pausedAnglesRef.current[node.category.id] !== undefined) {
        delete pausedAnglesRef.current[node.category.id];
      }
      const angle = pausedAnglesRef.current[node.category.id] ?? runningAngle;
      const x = node.radius * Math.cos(angle);
      const y = node.radius * Math.sin(angle) * node.flatten;
      const z = node.depth;
      child.position.set(x, y, z);
      if (hoveredId !== node.category.id && planetMesh) {
        planetMesh.rotation.y += delta * 0.6;
        planetMesh.rotation.x += delta * 0.25;
      }
    });
  });

  return (
    <>
      {orbitNodes.map((node) => {
        const rx = node.radius;
        const ry = node.radius * node.flatten;
        if (!Number.isFinite(rx) || !Number.isFinite(ry) || rx <= 0 || ry <= 0) return null;
        return <OrbitRing key={`ring-${node.category.id}`} rx={rx} ry={ry} />;
      })}
      <group ref={groupRef}>
        {orbitNodes.map((node) => (
          <group key={node.category.id}>
            <mesh
              onPointerOver={() => setHoveredId(node.category.id)}
              onPointerOut={() => setHoveredId((id) => (id === node.category.id ? null : id))}
            >
              <sphereGeometry args={[0.65, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.45, 42, 42]} />
              <meshStandardMaterial
                color={node.color}
                metalness={0.65}
                roughness={0.25}
                emissive={hoveredId === node.category.id ? node.color : "#0b1020"}
                emissiveIntensity={hoveredId === node.category.id ? 0.65 : 0.25}
              />
            </mesh>
            {hoveredId === node.category.id && (
              <Html center transform distanceFactor={12} position={[0, 1.1, 0]} style={{ pointerEvents: "none" }}>
                <SpecCardHtml category={node.category} />
              </Html>
            )}
          </group>
        ))}
      </group>
    </>
  );
}

export function OrbitEffects({ categories }: { categories: SpecCategory[] }) {
  function InnerScene() {
    const { camera } = useThree();
    useEffect(() => {
      camera.position.set(0, 0, 12);
      camera.fov = 55;
      camera.updateProjectionMatrix();
    }, [camera]);

    return (
      <>
        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 8, 10]} intensity={0.7} />
        <directionalLight position={[-6, -8, -10]} intensity={0.2} />
        <ParticleField />
        <Planetarium categories={categories} />
      </>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 55 }}
      className="absolute inset-0 z-10"
      gl={{ antialias: true, alpha: true }}
    >
      <InnerScene />
    </Canvas>
  );
}

export default OrbitEffects;
