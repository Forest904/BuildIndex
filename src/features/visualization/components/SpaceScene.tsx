'use client';

import { useAuthStore } from "@/features/auth/state/useAuthStore";
import { defaultDevice } from "@/features/device/data/mockDevices";
import { useDeviceStore } from "@/features/device/state/useDeviceStore";
import { useOrbitStore } from "@/features/visualization/state/useOrbitStore";
import OrbitEffects from "./OrbitEffects";
import SketchfabViewer from "./SketchfabViewer";
import { useEffect, useState } from "react";

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

      <div className="relative mx-auto h-[calc(100vh-112px)] max-w-7xl px-6 py-8">
        <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/8 bg-slate-950/70 shadow-[0_0_80px_rgba(0,0,0,0.4)]">
          <div className="relative z-40 flex flex-col items-center gap-2 px-4 pt-6 text-center">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-50">
                {device.brand ? `${device.brand} ${device.name}` : device.name}
              </h2>
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
            <p className="max-w-2xl text-xs text-slate-400">{device.description}</p>
          </div>

          <OrbitEffects categories={categories} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(103,232,249,0.16),transparent_45%),radial-gradient(circle_at_62%_70%,rgba(168,85,247,0.14),transparent_44%)]" />

          <div className="absolute left-1/2 top-1/2 z-30 w-[260px] max-w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-cyan-200/25 bg-slate-950/85 p-3.5 shadow-2xl">
            <SketchfabViewer sketchfabUid={device.sketchfabUid} className="w-full" />
          </div>

          <div className="absolute bottom-6 left-6 z-40 w-72 rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-4 text-xs text-slate-300 shadow-lg">
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
                  <span>Flatten</span>
                  <span className="text-slate-200">{ellipse.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={1.1}
                  step={0.04}
                  value={ellipse}
                  onChange={(e) => setEllipse(parseFloat(e.target.value))}
                  className="w-full accent-purple-400"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Hover to pause a planet card. Controls adjust all ellipses and motion at once.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SpaceScene;
