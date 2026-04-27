"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { BasemapType, DEFAULT_BASEMAP, getBasemapUrl } from "@/utils/basemaps";

interface BasemapContextType {
  basemap: BasemapType;
  basemapUrl: string;
  setBasemap: (basemap: BasemapType) => void;
  toggleBasemap: () => void;
}

const BasemapContext = createContext<BasemapContextType | undefined>(undefined);

const STORAGE_KEY = "lesan-basemap";

export const BasemapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [basemap, setBasemapState] = useState<BasemapType>(DEFAULT_BASEMAP);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY) as BasemapType | null;
      if (stored && (stored === "osm" || stored === "mapir" || stored === "neshan")) {
        setBasemapState(stored);
      }
    }
  }, []);

  const setBasemap = useCallback((newBasemap: BasemapType) => {
    setBasemapState((prev) => {
      if (prev === newBasemap) return prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, newBasemap);
      }
      return newBasemap;
    });
  }, []);

  const toggleBasemap = useCallback(() => {
    const basemapOrder: BasemapType[] = ["osm", "mapir", "neshan"];
    const currentIndex = basemapOrder.indexOf(basemap);
    const nextIndex = (currentIndex + 1) % basemapOrder.length;
    setBasemap(basemapOrder[nextIndex]);
  }, [basemap, setBasemap]);

  const basemapUrl = mounted ? getBasemapUrl(basemap) : getBasemapUrl(DEFAULT_BASEMAP);

  return (
    <BasemapContext.Provider
      value={{
        basemap,
        basemapUrl,
        setBasemap,
        toggleBasemap,
      }}
    >
      {children}
    </BasemapContext.Provider>
  );
};

export const useBasemap = (): BasemapContextType => {
  const context = useContext(BasemapContext);
  if (!context) {
    throw new Error("useBasemap must be used within a BasemapProvider");
  }
  return context;
};