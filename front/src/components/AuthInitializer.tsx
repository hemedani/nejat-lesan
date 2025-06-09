"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

// Type definition for user levels
type UserLevel = "Ghost" | "Manager" | "Editor" | "Normal" | null;

// Valid user levels
const validLevels = ["Ghost", "Manager", "Editor", "Normal"];

interface AuthInitializerProps {
  isAuthenticated: boolean;
  userLevel: UserLevel; // Allow any type for server data
}

export function AuthInitializer({
  isAuthenticated,
  userLevel,
}: AuthInitializerProps) {
  const { setInitialAuthState } = useAuth();

  useEffect(() => {
    // Ensure userLevel is a valid type
    let normalizedLevel: UserLevel = null;

    if (
      userLevel &&
      typeof userLevel === "string" &&
      validLevels.includes(userLevel)
    ) {
      normalizedLevel = userLevel as UserLevel;
    }

    setInitialAuthState(isAuthenticated, normalizedLevel);
  }, [isAuthenticated, userLevel, setInitialAuthState]);

  return null; // This component doesn't render anything
}
