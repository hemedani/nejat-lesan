"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Type definition for user levels
type UserLevel = "Ghost" | "Manager" | "Editor" | "Enterprise" | null;

// Valid user levels
const validLevels = ["Ghost", "Manager", "Editor", "Enterprise"];

interface EnterpriseSettings {
  cities?: {
    _id: string;
    name: string;
    center_location: {
      type: "Point";
      coordinates: [number, number];
    };
  }[];
  provinces?: {
    _id: string;
    name: string;
    center_location: {
      type: "Point";
      coordinates: [number, number];
    };
  }[];
  availableCharts?: {
    [key: string]: {
      [filter: string]: boolean;
    };
  };
}

interface AuthInitializerProps {
  isAuthenticated: boolean;
  userLevel: UserLevel; // Allow any type for server data
  enterpriseSettings?: EnterpriseSettings;
}

export function AuthInitializer({
  isAuthenticated,
  userLevel,
  enterpriseSettings,
}: AuthInitializerProps) {
  const {
    setInitialAuthState,
    isAuthenticated: currentIsAuthenticated,
    userLevel: currentUserLevel,
    enterpriseSettings: currentEnterpriseSettings,
  } = useAuth();

  useEffect(() => {
    // Ensure userLevel is a valid type
    let normalizedLevel: UserLevel = null;

    if (userLevel && typeof userLevel === "string" && validLevels.includes(userLevel)) {
      normalizedLevel = userLevel as UserLevel;
    }

    // Only update if the values have actually changed compared to the current state
    if (
      isAuthenticated !== currentIsAuthenticated ||
      normalizedLevel !== currentUserLevel ||
      enterpriseSettings !== currentEnterpriseSettings
    ) {
      setInitialAuthState(isAuthenticated, normalizedLevel, enterpriseSettings);
    }
  }, [
    isAuthenticated,
    userLevel,
    enterpriseSettings,
    setInitialAuthState,
    currentIsAuthenticated,
    currentUserLevel,
    currentEnterpriseSettings,
  ]);

  return null; // This component doesn't render anything
}
