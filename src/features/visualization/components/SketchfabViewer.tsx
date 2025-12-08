'use client';

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Sketchfab?: SketchfabClientConstructor;
  }
}

type SketchfabAPI = {
  load: () => void;
  start: () => void;
  addEventListener: (event: string, callback: () => void) => void;
};

type SketchfabClient = {
  init: (
    uid: string,
    options: {
      token?: string;
      success: (api: SketchfabAPI) => void;
      error: () => void;
      autostart?: 0 | 1;
      transparent?: boolean;
      ui_watermark?: 0 | 1;
    },
  ) => void;
};

type SketchfabClientConstructor = new (iframe: HTMLIFrameElement) => SketchfabClient;

interface SketchfabViewerProps {
  sketchfabUid?: string;
  className?: string;
}

const SCRIPT_ID = "sketchfab-viewer-api";
const SCRIPT_SRC = "https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js";
const LOAD_TIMEOUT_MS = 15000;
const sketchfabToken = process.env.NEXT_PUBLIC_SKETCHFAB_TOKEN;
let scriptPromise: Promise<void> | null = null;

function loadSketchfabScript() {
  if (typeof window === "undefined" || window.Sketchfab) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => resolve();
    const handleError = () => {
      scriptPromise = null;
      reject(new Error("Sketchfab script failed to load"));
    };

    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = handleError;
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export function SketchfabViewer({ sketchfabUid, className }: SketchfabViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    async function initViewer() {
      if (!sketchfabUid || !iframeRef.current) {
        setStatus("idle");
        return;
      }

      setStatus("loading");

      try {
        await loadSketchfabScript();
        if (!window.Sketchfab) throw new Error("Sketchfab API unavailable");
        if (cancelled) return;

        const targetFrame = iframeRef.current;
        targetFrame.src = "";
        const client = new window.Sketchfab(targetFrame);

        if (timeoutId) window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          if (!cancelled) setStatus("error");
        }, LOAD_TIMEOUT_MS);

        client.init(sketchfabUid, {
          token: sketchfabToken || undefined,
          autostart: 1,
          transparent: true,
          ui_watermark: 0,
          success: (api: SketchfabAPI) => {
            api.load();
            api.start();
            api.addEventListener("viewerready", () => {
              if (!cancelled) {
                if (timeoutId) window.clearTimeout(timeoutId);
                setStatus("ready");
              }
            });
          },
          error: () => {
            if (timeoutId) window.clearTimeout(timeoutId);
            if (!cancelled) setStatus("error");
          },
        });
      } catch (error) {
        console.error("Sketchfab viewer init failed", error);
        if (timeoutId) window.clearTimeout(timeoutId);
        if (!cancelled) setStatus("error");
      }
    }

    initViewer();

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
      if (iframeRef.current) {
        iframeRef.current.src = "";
      }
    };
  }, [sketchfabUid, reloadKey]);

  if (!sketchfabUid) {
    return (
      <div className={className}>
        <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-sm text-slate-500">
          No Sketchfab UID available for this device yet.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
        {status !== "ready" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950/80 text-xs text-slate-400">
            {status === "loading" && "Loading 3D viewer..."}
            {status === "error" && "Viewer failed or timed out. Check UID/token or retry."}
            {status === "error" && (
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="rounded-full border border-cyan-300/40 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-cyan-100 transition hover:border-cyan-200/70"
              >
                Retry
              </button>
            )}
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Sketchfab Viewer"
          className={`h-full w-full transition-opacity duration-300 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
          allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}

export default SketchfabViewer;
