// =========================================================================
// src/context/GlobalChartFiltersContext.tsx
// Global Chart Filters Context with localStorage persistence
// =========================================================================

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ChartFilterState } from "@/components/dashboards/ChartsFilterSidebar";

const STORAGE_KEY = "lesan-global-chart-filters";

interface GlobalChartFiltersContextValue {
  globalFilters: ChartFilterState;
  setGlobalFilters: (filters: ChartFilterState) => void;
  clearGlobalFilters: () => void;
  hasGlobalFilters: boolean;
  globalFilterCount: number;
  globalFiltersVersion: number;
}

const GlobalChartFiltersContext = createContext<GlobalChartFiltersContextValue | undefined>(undefined);

function loadFromStorage(): ChartFilterState {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ChartFilterState;
    }
  } catch {
    // corrupted data
  }
  return {};
}

function saveToStorage(filters: ChartFilterState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // storage full or unavailable
  }
}

export function GlobalChartFiltersProvider({ children }: { children: ReactNode }) {
  const [globalFilters, setGlobalFiltersState] = useState<ChartFilterState>({});
  const [globalFiltersVersion, setGlobalFiltersVersion] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (Object.keys(stored).length > 0) {
      setGlobalFiltersState(stored);
      setGlobalFiltersVersion(1);
    }
  }, []);

  const setGlobalFilters = useCallback((filters: ChartFilterState) => {
    setGlobalFiltersState(filters);
    setGlobalFiltersVersion((v) => v + 1);
    saveToStorage(filters);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setGlobalFiltersState({});
    setGlobalFiltersVersion((v) => v + 1);
    saveToStorage({});
  }, []);

  const hasGlobalFilters = Object.keys(globalFilters).length > 0;
  const globalFilterCount = Object.entries(globalFilters).filter(([, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim() !== "";
    return true;
  }).length;

  return (
    <GlobalChartFiltersContext.Provider
      value={{
        globalFilters,
        setGlobalFilters,
        clearGlobalFilters,
        hasGlobalFilters,
        globalFilterCount,
        globalFiltersVersion,
      }}
    >
      {children}
    </GlobalChartFiltersContext.Provider>
  );
}

export function useGlobalChartFilters() {
  const ctx = useContext(GlobalChartFiltersContext);
  if (!ctx) {
    throw new Error("useGlobalChartFilters must be used within a GlobalChartFiltersProvider");
  }
  return ctx;
}
