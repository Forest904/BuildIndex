import { create } from "zustand";

interface AuthUser {
  id: string;
  email: string;
  username?: string;
}

interface AuthState {
  user?: AuthUser | null;
  loading: boolean;
  error?: string;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  loading: false,
  error: undefined,
  fetchMe: async () => {
    set({ loading: true });
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (response.status === 401) {
        set({ user: null, loading: false });
        return;
      }
      if (!response.ok) throw new Error(`me failed: ${response.status}`);
      const data = await response.json();
      set({ user: data.user, loading: false });
    } catch (error) {
      console.error("auth me failed", error);
      set({ user: null, loading: false, error: "Auth check failed" });
    }
  },
  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set({ user: null });
    }
  },
}));
