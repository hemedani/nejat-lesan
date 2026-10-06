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

const getInitialBasemap = (): BasemapType => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as BasemapType | null;
      if (stored && (stored === "osm" || stored === "mapir" || stored === "neshan")) {
        return stored;
      }
    } catch {
      // localStorage not available
    }
  }
  return DEFAULT_BASEMAP;
};

export const BasemapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [basemap, setBasemapState] = useState<BasemapType>(getInitialBasemap);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

/**
 * The basemap preference, or `undefined` outside a provider.
 *
 * For components that must render *somewhere* — a report map that can be mounted
 * without the app shell, a test, a storybook. Catching the throw from `useBasemap`
 * would work but turns a missing provider into exception-driven control flow in the
 * middle of a render, and `useContext` would still have been called on one path and
 * not the other as far as a reader is concerned.
 *
 * Hook order is stable: `useContext` is called on every render and only the
 * *result* is narrowed, so this is safe where a conditional `useBasemap()` is not.
 */
export const useOptionalBasemap = (): BasemapContextType | undefined =>
  useContext(BasemapContext);;