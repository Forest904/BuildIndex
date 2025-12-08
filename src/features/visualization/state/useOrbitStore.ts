import { create } from "zustand";

interface OrbitState {
  speedMultiplier: number; // 0.5 - 2
  ellipse: number; // 0.5 fixed scaleY factor
  setSpeedMultiplier: (value: number) => void;
}

export const useOrbitStore = create<OrbitState>((set) => ({
  speedMultiplier: 0.5,
  ellipse: 0.5,
  setSpeedMultiplier: (value) => set({ speedMultiplier: value }),
}));
