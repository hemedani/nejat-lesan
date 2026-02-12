"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

type UserLevel = "Ghost" | "Manager" | "Editor" | "Enterprise" | null;

// Define the structure for enterprise user settings
interface City {
  _id: string;
  name: string;
  center_location: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface Province {
  _id: string;
  name: string;
  center_location: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface ChartPermissions {
  [key: string]: {
    [filter: string]: boolean;
  };
}

interface EnterpriseSettings {
  cities?: City[];
  provinces?: Province[];
  availableCharts?: ChartPermissions;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userLevel: UserLevel;
  enterpriseSettings?: EnterpriseSettings;
  login: (
    token: string,
    level: UserLevel,
    nationalNumber: string,
    settings?: EnterpriseSettings,
  ) => void;
  logout: () => void;
  setInitialAuthState: (isAuth: boolean, level: UserLevel, settings?: EnterpriseSettings) => void;
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
  const [enterpriseSettings, setEnterpriseSettings] = useState<EnterpriseSettings | undefined>(
    undefined,
  );
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on initial load
    const token = Cookies.get("token");
    const userCookie = Cookies.get("user");

    if (token && userCookie) {
      try {
        // Handle different formats of the user cookie
        let level: UserLevel = null;
        let settings: EnterpriseSettings | undefined = undefined;

        // First try to parse as JSON
        try {
          const userData = JSON.parse(userCookie);
          level = userData.level || null;
          settings = userData.settings || undefined;
        } catch (parseError) {
          // If it's not valid JSON, the server might have set it in a different format
          // Just use the default level
          console.warn("Could not parse user cookie as JSON, using default level " + parseError);
        }

        // Only update state if values have actually changed
        if (!isAuthenticated || userLevel !== level || enterpriseSettings !== settings) {
          setIsAuthenticated(true);
          setUserLevel(level);
          setEnterpriseSettings(settings);
        }
      } catch (error) {
        console.error("Error processing user cookie:", error);
        // Only update state if values have actually changed
        if (isAuthenticated || userLevel !== null || enterpriseSettings !== undefined) {
          setIsAuthenticated(false);
          setUserLevel(null);
          setEnterpriseSettings(undefined);
        }
      }
    } else {
      // Only update state if values have actually changed
      if (isAuthenticated || userLevel !== null || enterpriseSettings !== undefined) {
        setIsAuthenticated(false);
        setUserLevel(null);
        setEnterpriseSettings(undefined);
      }
    }
  }, []); // Empty dependency array to run only once on mount

  const setInitialAuthState = (isAuth: boolean, level: UserLevel, settings?: EnterpriseSettings) => {
    setIsAuthenticated(isAuth);
    setUserLevel(level);
    setEnterpriseSettings(settings);
  };

  const login = (
    token: string,
    level: UserLevel,
    nationalNumber: string,
    settings?: EnterpriseSettings,
  ) => {
    // Set cookies
    Cookies.set("token", token, { path: "/" });
    Cookies.set("national_number", nationalNumber, { path: "/" });
    Cookies.set("user", JSON.stringify({ level, settings }), { path: "/" });

    // Update state
    setIsAuthenticated(true);
    setUserLevel(level);
    setEnterpriseSettings(settings);
  };

  const logout = () => {
    // Remove cookies
    Cookies.remove("token", { path: "/" });
    Cookies.remove("national_number", { path: "/" });
    Cookies.remove("user", { path: "/" });

    // Update state to reflect logout
    setIsAuthenticated(false);
    setUserLevel(null);
    setEnterpriseSettings(undefined);

    // Force a small delay to ensure state updates before redirect
    setTimeout(() => {
      router.push("/");
    }, 0);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userLevel,
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
