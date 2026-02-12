"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import type { UserLevel, UserData, EnterpriseSettings } from "@/types/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  userLevel: UserLevel;
  userData: UserData | null;
  enterpriseSettings?: EnterpriseSettings;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  setInitialAuthState: (isAuth: boolean, userData: UserData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userLevel, setUserLevel] = useState<UserLevel>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enterpriseSettings, setEnterpriseSettings] = useState<EnterpriseSettings | undefined>(
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    // Check if token exists on initial load
    const token = Cookies.get("token");

    if (!token) {
      // No token means not authenticated
      if (isAuthenticated || userData !== null) {
        setIsAuthenticated(false);
        setUserLevel(null);
        setUserData(null);
        setEnterpriseSettings(undefined);
      }
    }
    // If token exists, the layout.tsx will call setInitialAuthState with user data from getMe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const setInitialAuthState = (isAuth: boolean, user: UserData | null) => {
    setIsAuthenticated(isAuth);
    if (user) {
      setUserLevel(user.level);
      setUserData(user);
      setEnterpriseSettings(user.settings);
    } else {
      setUserLevel(null);
      setUserData(null);
      setEnterpriseSettings(undefined);
    }
  };

  const login = (token: string, user: UserData) => {
    // Set only token in cookie
    Cookies.set("token", token, { path: "/" });

    // Store all user data in context state
    setIsAuthenticated(true);
    setUserLevel(user.level);
    setUserData(user);
    setEnterpriseSettings(user.settings);
  };

  const logout = () => {
    // Remove only the token cookie
    Cookies.remove("token", { path: "/" });

    // Clear all state
    setIsAuthenticated(false);
    setUserLevel(null);
    setUserData(null);
    setEnterpriseSettings(undefined);

    // Redirect to home
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userLevel,
        userData,
        enterpriseSettings,
        login,
        logout,
        setInitialAuthState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
