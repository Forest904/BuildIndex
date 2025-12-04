import { Device, DeviceSearchResult } from "@/domain/models";
import { create } from "zustand";

interface DeviceState {
  selectedDevice?: Device;
  searchResults: DeviceSearchResult[];
  loading: boolean;
  error?: string;
  setSelectedDevice: (device?: Device) => void;
  setSearchResults: (results: DeviceSearchResult[]) => void;
  setLoading: (value: boolean) => void;
  setError: (message?: string) => void;
  reset: () => void;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  selectedDevice: undefined,
  searchResults: [],
  loading: false,
  error: undefined,
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (value) => set({ loading: value }),
  setError: (message) => set({ error: message }),
  reset: () => set({ selectedDevice: undefined, searchResults: [], loading: false, error: undefined }),
}));
