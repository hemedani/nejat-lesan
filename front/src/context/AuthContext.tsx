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
  const [enterpriseSettings, setEnterpriseSettings] = useState<EnterpriseSettings | undefined>(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Initialize from cookie on mount
  useEffect(() => {
    const token = Cookies.get("token");
    const storedUser = sessionStorage.getItem("lesan_user");
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as UserData;
        setIsAuthenticated(true);
        setUserLevel(user.level);
        setUserData(user);
        setEnterpriseSettings(user.settings);
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (token: string, user: UserData) => {
    Cookies.set("token", token, { path: "/", expires: 7, sameSite: "lax" });
    setIsAuthenticated(true);
    setUserLevel(user.level);
    setUserData(user);
    setEnterpriseSettings(user.settings);
    sessionStorage.setItem("lesan_user", JSON.stringify(user));
  };

  const logout = () => {
    Cookies.remove("token", { path: "/" });
    sessionStorage.removeItem("lesan_user");
    setIsAuthenticated(false);
    setUserLevel(null);
    setUserData(null);
    setEnterpriseSettings(undefined);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
