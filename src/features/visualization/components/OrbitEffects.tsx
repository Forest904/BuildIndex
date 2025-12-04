"use client";

import { useOrbitStore } from "@/features/visualization/state/useOrbitStore";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, Points } from "three";

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

export function OrbitEffects() {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 55 }}
      className="pointer-events-none absolute inset-0"
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      <ParticleField />
    </Canvas>
  );
}

export default OrbitEffects;
