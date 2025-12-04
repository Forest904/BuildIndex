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
const sketchfabToken = process.env.NEXT_PUBLIC_SKETCHFAB_TOKEN;

export function SketchfabViewer({ sketchfabUid, className }: SketchfabViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    let cancelled = false;

    async function ensureScript() {
      if (typeof window === "undefined") return;
      if (window.Sketchfab) return;

      return new Promise<void>((resolve, reject) => {
        if (document.getElementById(SCRIPT_ID)) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Sketchfab script failed to load"));
        document.body.appendChild(script);
      });
    }

    async function initViewer() {
      if (!sketchfabUid || !iframeRef.current) {
        setStatus("idle");
        return;
      }
      setStatus("loading");

      try {
        await ensureScript();
        if (!window.Sketchfab) throw new Error("Sketchfab API unavailable");
        if (cancelled) return;

        const client = new window.Sketchfab(iframeRef.current);
        client.init(sketchfabUid, {
          token: sketchfabToken,
          autostart: 1,
          transparent: true,
          ui_watermark: 0,
          success: (api: SketchfabAPI) => {
            api.load();
            api.start();
            api.addEventListener("viewerready", () => {
              if (!cancelled) setStatus("ready");
            });
          },
          error: () => {
            if (!cancelled) setStatus("error");
          },
        });
      } catch (error) {
        console.error("Sketchfab viewer init failed", error);
        if (!cancelled) setStatus("error");
      }
    }

    initViewer();

    return () => {
      cancelled = true;
    };
  }, [sketchfabUid]);

  if (!sketchfabUid) {
    return (
      <div className={className}>
        <div className="flex h-48 w-full items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70 text-sm text-slate-500">
          No Sketchfab UID yet. Using placeholder.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80">
        {status !== "ready" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 text-xs text-slate-400">
            {status === "loading" && "Loading viewer..."}
            {status === "error" && "Viewer failed. Try again later."}
          </div>
        )}
        <iframe
          ref={iframeRef}
          title="Sketchfab Viewer"
          className={`h-full w-full ${status === "ready" ? "opacity-100" : "opacity-0"}`}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          mozallowfullscreen
          webkitallowfullscreen
        />
      </div>
    </div>
  );
}

export default SketchfabViewer;
