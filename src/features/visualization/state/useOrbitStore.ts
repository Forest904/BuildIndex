import { create } from "zustand";

interface OrbitState {
  speedMultiplier: number; // 0.5 - 2
  ellipse: number; // 0.6 - 1.4 scaleY factor
  setSpeedMultiplier: (value: number) => void;
  setEllipse: (value: number) => void;
}

export const useOrbitStore = create<OrbitState>((set) => ({
  speedMultiplier: 1,
  ellipse: 1,
  setSpeedMultiplier: (value) => set({ speedMultiplier: value }),
  setEllipse: (value) => set({ ellipse: value }),
}));
