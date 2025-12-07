'use client';

import { Input } from "@/components/ui/Input";
import { DeviceSearchResult } from "@/domain/models";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/state/useAuthStore";
import { useDeviceStore } from "@/features/device/state/useDeviceStore";
import { useFavorites } from "@/features/device/hooks/useFavorites";

const isAbortError = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

export function Header() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { searchResults, setSearchResults, setSelectedDevice, loading, setLoading, setError } =
    useDeviceStore();
  const { user, fetchMe, logout, loading: authLoading } = useAuthStore();
  const { favorites, refetch: refetchFavorites } = useFavorites(user?.id ?? null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user) refetchFavorites();
  }, [user, refetchFavorites]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(undefined);

      try {
        const response = await fetch(`/api/devices/search?query=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status}`);
        }

        const results: DeviceSearchResult[] = await response.json();
        setSearchResults(results);
        setOpen(true);
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Device search failed", error);
          setError("Search failed. Using mock data.");
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [query, setError, setLoading, setSearchResults]);

  const handleSelect = async (result: DeviceSearchResult) => {
    setQuery(result.name);
    setOpen(false);
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/devices/${result.id}`);
      if (!response.ok) {
        throw new Error(`Device fetch failed: ${response.status}`);
      }

      const device = await response.json();
      setSelectedDevice(device);
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("Load device failed", error);
        setError("Could not load device details. Showing fallback.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-cyan-200 transition hover:text-cyan-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-500/10 text-lg font-semibold">
            BI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm text-slate-400">BuildIndex</span>
            <span className="text-base font-semibold text-slate-100">Device Orbits</span>
          </div>
        </Link>

        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
          </div>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search devices (e.g., RTX 4080 laptop)"
            className="pl-10"
          />
          <p className="mt-1 text-xs text-slate-500">
            Live suggestions from the local devices.csv dataset; Sketchfab UIDs still flow through the device.
          </p>

          {open && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur">
              <ul className="divide-y divide-white/5">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(result)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-cyan-500/10"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{result.name}</span>
                        <span className="text-xs text-slate-500">{result.brand ?? "Unknown brand"}</span>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.08em] text-cyan-200">Select</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {query.trim().length >= 2 && !loading && open && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-2xl border border-white/10 bg-slate-900/95 px-4 py-3 text-sm text-slate-300 shadow-2xl backdrop-blur">
              No matches yet. Try a different keyword.
            </div>
          )}
        </div>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 hover:border-cyan-200/40"
            >
              <div className="flex flex-col leading-tight text-left">
                <span className="text-[11px] uppercase tracking-[0.08em] text-slate-500">Signed in</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <span className="text-xs text-slate-400">{userMenuOpen ? "?" : "?"}</span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 text-sm text-slate-200 shadow-2xl backdrop-blur">
                <div className="border-b border-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-slate-500">
                  Favourites
                </div>
                <div className="max-h-64 overflow-auto divide-y divide-white/5">
                  {favorites.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-500">No favourites yet.</div>
                  ) : (
                    favorites.map((fav) => (
                      <button
                        key={fav.id}
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleSelect({ id: fav.id, name: fav.name, brand: fav.brand });
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-cyan-500/10"
                      >
                        <span className="truncate">
                          {fav.brand ? `${fav.brand} ${fav.name}` : fav.name}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.08em] text-cyan-200">Load</span>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full border-t border-white/5 px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-red-200 hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/auth/login"
            className="group flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-500/15"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-4 w-4"
            >
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5z" />
              <path d="M3 20a9 9 0 0 1 18 0" />
            </svg>
            {authLoading ? "Checking..." : "Login"}
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
