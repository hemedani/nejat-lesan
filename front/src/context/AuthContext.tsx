"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

type UserLevel = "Ghost" | "Manager" | "Editor" | "Normal" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  userLevel: UserLevel;
  login: (token: string, level: UserLevel, nationalNumber: string) => void;
  logout: () => void;
  setInitialAuthState: (isAuth: boolean, level: UserLevel) => void;
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
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on initial load
    const token = Cookies.get("token");
    const userCookie = Cookies.get("user");

    if (token && userCookie) {
      try {
        // Handle different formats of the user cookie
        let level: UserLevel = null;

        // First try to parse as JSON
        try {
          const userData = JSON.parse(userCookie);
          level = userData.level || null;
        } catch (parseError) {
          // If it's not valid JSON, the server might have set it in a different format
          // Just use the default level
          console.warn("Could not parse user cookie as JSON, using default level " + parseError);
        }

        setIsAuthenticated(true);
        setUserLevel(level);
      } catch (error) {
        console.error("Error processing user cookie:", error);
        setIsAuthenticated(false);
        setUserLevel(null);
      }
    } else {
      setIsAuthenticated(false);
      setUserLevel(null);
    }
  }, [isAuthenticated]);

  const setInitialAuthState = (isAuth: boolean, level: UserLevel) => {
    setIsAuthenticated(isAuth);
    setUserLevel(level);
  };

  const login = (token: string, level: UserLevel, nationalNumber: string) => {
    // Set cookies
    Cookies.set("token", token, { path: "/" });
    Cookies.set("national_number", nationalNumber, { path: "/" });
    Cookies.set("user", JSON.stringify({ level }), { path: "/" });

    // Update state
    setIsAuthenticated(true);
    setUserLevel(level);
  };

  const logout = () => {
    // Remove cookies
    Cookies.remove("token", { path: "/" });
    Cookies.remove("national_number", { path: "/" });
    Cookies.remove("user", { path: "/" });

    setInitialAuthState(false, null)

    // Redirect to home page
    router.replace("/");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userLevel, login, logout, setInitialAuthState }}
    >
      {children}
    </AuthContext.Provider>
  );
};
