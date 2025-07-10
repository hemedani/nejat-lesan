"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { RoadDefectsFilterState } from "@/components/dashboards/ChartsFilterSidebar";

// Interface for a single comparison snapshot
export interface ComparisonItem {
  id: string; // Unique identifier (timestamp)
  imageDataUrl: string; // Base64 image string from html-to-image
  filters: RoadDefectsFilterState; // The applied filter state
  createdAt: Date; // When the snapshot was taken
  title?: string; // Optional custom title for the snapshot
}

// Context state interface
interface MapComparisonContextType {
  comparisonItems: ComparisonItem[];
  addComparison: (item: Omit<ComparisonItem, "id" | "createdAt">) => void;
  removeComparison: (id: string) => void;
  clearComparisons: () => void;
  getComparisonCount: () => number;
}

// Create the context
const MapComparisonContext = createContext<MapComparisonContextType | undefined>(
  undefined
);

// Provider component
export const MapComparisonProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);

  // Add a new comparison snapshot
  const addComparison = (item: Omit<ComparisonItem, "id" | "createdAt">) => {
    const newItem: ComparisonItem = {
      ...item,
      id: Date.now().toString(), // Simple timestamp-based ID
      createdAt: new Date(),
    };

    setComparisonItems((prev) => [...prev, newItem]);
  };

  // Remove a comparison by ID
  const removeComparison = (id: string) => {
    setComparisonItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear all comparisons
  const clearComparisons = () => {
    setComparisonItems([]);
  };

  // Get the current count of comparisons
  const getComparisonCount = () => {
    return comparisonItems.length;
  };

  const value: MapComparisonContextType = {
    comparisonItems,
    addComparison,
    removeComparison,
    clearComparisons,
    getComparisonCount,
  };

  return (
    <MapComparisonContext.Provider value={value}>
      {children}
    </MapComparisonContext.Provider>
  );
};

// Custom hook to use the map comparison context
export const useMapComparison = (): MapComparisonContextType => {
  const context = useContext(MapComparisonContext);
  if (context === undefined) {
    throw new Error(
      "useMapComparison must be used within a MapComparisonProvider"
    );
  }
  return context;
};

// Helper function to generate a descriptive title for a comparison
export const generateComparisonTitle = (filters: RoadDefectsFilterState): string => {
  const parts: string[] = [];

  // Add date range if available
  if (filters.dateOfAccidentFrom && filters.dateOfAccidentTo) {
    parts.push(`${filters.dateOfAccidentFrom} تا ${filters.dateOfAccidentTo}`);
  } else if (filters.dateOfAccidentFrom) {
    parts.push(`از ${filters.dateOfAccidentFrom}`);
  } else if (filters.dateOfAccidentTo) {
    parts.push(`تا ${filters.dateOfAccidentTo}`);
  }

  // Add province if available
  if (filters.province && filters.province.length > 0) {
    if (filters.province.length === 1) {
      parts.push(`استان ${filters.province[0]}`);
    } else {
      parts.push(`${filters.province.length} استان`);
    }
  }

  // Add accident type if available
  if (filters.accidentType && filters.accidentType.length > 0) {
    if (filters.accidentType.length === 1) {
      parts.push(`نوع: ${filters.accidentType[0]}`);
    } else {
      parts.push(`${filters.accidentType.length} نوع تصادف`);
    }
  }

  // Add collision type if available
  if (filters.collisionType && filters.collisionType.length > 0) {
    if (filters.collisionType.length === 1) {
      parts.push(`برخورد: ${filters.collisionType[0]}`);
    } else {
      parts.push(`${filters.collisionType.length} نوع برخورد`);
    }
  }

  // If no specific filters, return a generic title
  if (parts.length === 0) {
    return "همه تصادفات";
  }

  return parts.join(" - ");
};
