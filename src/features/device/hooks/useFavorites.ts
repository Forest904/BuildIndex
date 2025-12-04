"use client";

import { useEffect, useMemo, useState } from "react";

export function useFavorites(userId?: string | null) {
  const [favorites, setFavorites] = useState<Array<{ id: string; name: string; brand?: string }>>([]);
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useMemo(
    () =>
      async function load() {
        if (!userId) {
          setFavorites([]);
          return;
        }
        setLoading(true);
        try {
          const response = await fetch("/api/favorites", { cache: "no-store" });
          if (response.ok) {
            const data = await response.json();
            setFavorites(data);
          }
        } catch (error) {
          console.error("favorites fetch failed", error);
        } finally {
          setLoading(false);
        }
      },
    [userId],
  );

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, loading, refetch: fetchFavorites };
}
