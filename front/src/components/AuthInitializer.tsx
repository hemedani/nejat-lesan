"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UserLevel, UserData } from "@/types/auth";

const validLevels = ["Ghost", "Manager", "Editor", "Enterprise"];

interface AuthInitializerProps {
  isAuthenticated: boolean;
  userData: UserData | null;
}

export function AuthInitializer({ isAuthenticated, userData }: AuthInitializerProps) {
  const { setInitialAuthState } = useAuth();

  useEffect(() => {
    let normalizedUserData: UserData | null = null;

    if (userData && userData.level) {
      if (typeof userData.level === "string" && validLevels.includes(userData.level)) {
        normalizedUserData = {
          ...userData,
          level: userData.level as UserLevel,
        };
      }
    }

    setInitialAuthState(isAuthenticated, normalizedUserData);
  }, [isAuthenticated, userData, setInitialAuthState]);

  return null;
}
