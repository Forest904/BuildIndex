'use client';

import { SpecCategory } from "@/domain/models";
import { useAuthStore } from "@/features/auth/state/useAuthStore";
import { defaultDevice } from "@/features/device/data/mockDevices";
import { useDeviceStore } from "@/features/device/state/useDeviceStore";
import { useOrbitStore } from "@/features/visualization/state/useOrbitStore";
import OrbitEffects from "./OrbitEffects";
import SketchfabViewer from "./SketchfabViewer";
import { useEffect, useState } from "react";

interface OrbitCardProps {
  category: SpecCategory;
}

function OrbitCard({ category }: OrbitCardProps) {
  const { speedMultiplier, ellipse } = useOrbitStore();
  const [paused, setPaused] = useState(false);
  const radius = category.orbitHint?.radius ?? 150;
  const speed = category.orbitHint?.speed ?? 0.8;
  const duration = Math.max(6, (24 / speed) / Math.max(0.25, speedMultiplier));
  const phase = category.orbitHint?.phase ?? 0;

  return (
    <div
      className={`orbit-animate ${paused ? "paused" : ""}`}
      style={{
        // @ts-expect-error CSS custom properties
        "--radius": `${radius}px`,
        // @ts-expect-error CSS custom properties
        "--duration": `${duration}s`,
        // @ts-expect-error CSS custom properties
        "--phase": `${phase}deg`,
        // @ts-expect-error CSS custom properties
        "--ellipse": ellipse,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="w-44 rounded-xl border border-white/12 bg-slate-900/80 p-3 text-xs shadow-xl backdrop-blur">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-slate-400">
          <span>{category.name}</span>
          <span className="rounded-full bg-cyan-500/12 px-2 py-0.5 text-[10px] text-cyan-200">Orbit</span>
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
        <p className="mt-2 text-[10px] text-slate-500">Hover to pause orbit.</p>
      </div>
    </div>
  );
}

export function SpaceScene() {
  const device = useDeviceStore((state) => state.selectedDevice) ?? defaultDevice;
  const categories = device.categories ?? [];
  const { speedMultiplier, ellipse, setSpeedMultiplier, setEllipse } = useOrbitStore();
  const { user, fetchMe } = useAuthStore();
  const [favorite, setFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!user || !device?.id) {
      setFavorite(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/favorites", { cache: "no-store" });
        if (!response.ok) return;
        const favs: Array<{ id: string }> = await response.json();
        if (!active) return;
        setFavorite(favs.some((fav) => fav.id === device.id));
      } catch (error) {
        console.error("favorites load failed", error);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, device?.id]);

  const toggleFavorite = async () => {
    if (!user || !device?.id) return;
    setFavLoading(true);
    try {
      if (favorite) {
        await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: device.id }),
        });
        setFavorite(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: device.id }),
        });
        setFavorite(true);
      }
    } catch (error) {
      console.error("favorite toggle failed", error);
    } finally {
      setFavLoading(false);
    }
  };

  return (
    <section className="relative flex-1 overflow-hidden">
      <div className="absolute inset-0 space-grid opacity-50" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.14),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.16),transparent_26%)]" />
      <OrbitEffects />

      <div className="relative mx-auto flex h-[calc(100vh-112px)] max-w-6xl items-center justify-center px-6 py-6">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/8 bg-slate-950/70 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(103,232,249,0.18),transparent_45%),radial-gradient(circle_at_60%_70%,rgba(168,85,247,0.16),transparent_40%)]" />

          <div className="absolute bottom-6 left-6 z-20 w-72 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-xs text-slate-300 shadow-lg">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-slate-400">
              <span>Orbit Controls</span>
              <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-cyan-200">Live</span>
            </div>
            <div className="mt-3 space-y-3 text-[11px] text-slate-400">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Speed</span>
                  <span className="text-slate-200">{speedMultiplier.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>Ellipse</span>
                  <span className="text-slate-200">{ellipse.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.4}
                  step={0.05}
                  value={ellipse}
                  onChange={(e) => setEllipse(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Hover a card to pause its orbit. Controls affect all orbiters in real time.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <div className="relative flex w-[360px] flex-col gap-3 rounded-3xl border border-cyan-200/25 bg-slate-950/80 px-6 py-6 text-center shadow-2xl">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.1em] text-cyan-200/80">
                <span>Selected Device</span>
                {user && (
                  <button
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.08em] transition ${
                      favorite
                        ? "border-cyan-300/60 bg-cyan-500/15 text-cyan-100"
                        : "border-white/10 text-slate-300 hover:border-cyan-300/40"
                    }`}
                  >
                    {favorite ? "Favoured" : "Fav"}
                  </button>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-slate-50">
                {device.brand ? `${device.brand} ${device.name}` : device.name}
              </h2>
              <p className="text-sm text-slate-400">{device.description}</p>
              <SketchfabViewer sketchfabUid={device.sketchfabUid} className="w-full" />
              <p className="text-[11px] text-slate-500">
                Using Sketchfab Viewer API (no downloads). Swap UID via TechSpecs/DB.
              </p>
            </div>

            {categories.map((category) => (
              <OrbitCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpaceScene;
