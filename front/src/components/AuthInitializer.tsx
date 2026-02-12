"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserLevel, UserData } from "@/types/auth";

// Valid user levels
const validLevels = ["Ghost", "Manager", "Editor", "Enterprise"];

interface AuthInitializerProps {
  isAuthenticated: boolean;
  userData: UserData | null;
}

export function AuthInitializer({ isAuthenticated, userData }: AuthInitializerProps) {
  const {
    setInitialAuthState,
    isAuthenticated: currentIsAuthenticated,
    userData: currentUserData,
  } = useAuth();

  useEffect(() => {
    // Ensure userLevel is a valid type if userData exists
    let normalizedUserData: UserData | null = null;

    if (userData && userData.level) {
      if (typeof userData.level === "string" && validLevels.includes(userData.level)) {
        normalizedUserData = {
          ...userData,
          level: userData.level as UserLevel,
        };
      }
    }

    // Only update if the values have actually changed compared to the current state
    if (
      isAuthenticated !== currentIsAuthenticated ||
      JSON.stringify(normalizedUserData) !== JSON.stringify(currentUserData)
    ) {
      setInitialAuthState(isAuthenticated, normalizedUserData);
    }
  }, [isAuthenticated, userData, setInitialAuthState, currentIsAuthenticated, currentUserData]);

  return null; // This component doesn't render anything
}
