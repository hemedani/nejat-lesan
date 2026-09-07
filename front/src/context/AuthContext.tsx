"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import type { UserLevel, UserData, EnterpriseSettings, ModuleKey, ModuleFeed, UserRole, RoleName } from "@/types/auth";
import { getModules } from "@/app/actions/app_modules/getModules";

const SESSION_KEY = "lesan_user";
const MODULE_FEED_KEY = "lesan_module_feed";

const ORG_ROLE_NAMES: RoleName[] = ["OrgHead", "UnitHead", "Officer"];

interface AuthContextType {
  isAuthenticated: boolean;
  userLevel: UserLevel;
  userData: UserData | null;
  enterpriseSettings?: EnterpriseSettings;
  patrolPermissions?: UserData["patrol_permissions"];
  orgRoles: UserRole[];
  isOrgLeader: boolean;
  isOrgHead: boolean;
  isUnitHead: boolean;
  primaryOrgRole: UserRole | undefined;
  hasOrgRole: (name: RoleName) => boolean;
  enabledModules: string[];
  orgEnabledModules: string[];
  modulesKnown: boolean;
  hasModule: (key: ModuleKey) => boolean;
  orgHasModule: (key: ModuleKey) => boolean;
  refreshModules: () => Promise<void>;
  login: (token: string, userData: UserData, moduleFeed?: ModuleFeed) => void;
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

const readStoredModuleFeed = (): ModuleFeed | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MODULE_FEED_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ModuleFeed;
    return typeof parsed?.modules === "undefined" && typeof parsed?.orgModules === "undefined"
      ? null
      : parsed;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userLevel, setUserLevel] = useState<UserLevel>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enterpriseSettings, setEnterpriseSettings] = useState<EnterpriseSettings | undefined>(undefined);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [orgEnabledModules, setOrgEnabledModules] = useState<string[]>([]);
  const [modulesKnown, setModulesKnown] = useState<boolean>(false);
  const router = useRouter();

  const applyModuleFeed = (feed: ModuleFeed | null | undefined) => {
    if (feed?.modules) {
      setEnabledModules(feed.modules);
      setModulesKnown(true);
    }
    if (Array.isArray(feed?.orgModules)) {
      setOrgEnabledModules(feed.orgModules);
    }
  };

  // Initialize from cookie on mount
  useEffect(() => {
    const token = Cookies.get("token");
    const storedUser = sessionStorage.getItem(SESSION_KEY);

    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as UserData;
        setIsAuthenticated(true);
        setUserLevel(user.level);
        setUserData(user);
        setEnterpriseSettings(user.settings);
        const feed = readStoredModuleFeed();
        applyModuleFeed(feed || { modules: user.modules, orgModules: user.orgModules });
      } catch {
        Cookies.remove("token", { path: "/" });
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(MODULE_FEED_KEY);
      }
    }
  }, []);

  const login = (token: string, user: UserData, moduleFeed?: ModuleFeed) => {
    Cookies.set("token", token, { path: "/", expires: 7, sameSite: "lax" });
    setIsAuthenticated(true);
    setUserLevel(user.level);
    setUserData(user);
    setEnterpriseSettings(user.settings);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    if (moduleFeed?.modules || moduleFeed?.orgModules) {
      sessionStorage.setItem(MODULE_FEED_KEY, JSON.stringify(moduleFeed));
    }
    applyModuleFeed(moduleFeed || { modules: user.modules, orgModules: user.orgModules });
  };

  const logout = () => {
    Cookies.remove("token", { path: "/" });
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(MODULE_FEED_KEY);
    setIsAuthenticated(false);
    setUserLevel(null);
    setUserData(null);
    setEnterpriseSettings(undefined);
    setEnabledModules([]);
    setOrgEnabledModules([]);
    setModulesKnown(false);
    router.push("/");
  };

  const refreshModules = async () => {
    try {
      const response = await getModules();
      if (response.success && Array.isArray(response.body?.modules)) {
        const keys = (response.body.modules as Array<{ key: string; enabled: boolean }>)
          .filter((m) => m.enabled)
          .map((m) => m.key);
        setEnabledModules(keys);
        setModulesKnown(true);
      }
    } catch {
      // Ignore — keep last known feed; gating degrades to "enabled".
    }
  };

  const isGhost = userLevel === "Ghost";

  const orgRoles = useMemo<UserRole[]>(() => {
    return (userData?.roles || []).filter(
      (role) => ORG_ROLE_NAMES.includes(role.name) && role.scopeType && role.scopeId,
    );
  }, [userData]);

  const isOrgHead = userLevel === "OrgHead" || orgRoles.some((role) => role.name === "OrgHead");
  const isUnitHead = userLevel === "UnitHead" || orgRoles.some((role) => role.name === "UnitHead");
  const isOrgLeader = isOrgHead || isUnitHead;

  const primaryOrgRole = useMemo<UserRole | undefined>(() => {
    return (
      orgRoles.find((role) => role.name === "OrgHead") ??
      orgRoles.find((role) => role.name === "UnitHead") ??
      orgRoles[0]
    );
  }, [orgRoles]);

  const hasOrgRole = (name: RoleName): boolean =>
    (userData?.roles || []).some((role) => role.name === name);

  const hasModule = (key: ModuleKey): boolean => {
    if (isGhost) return true;
    if (!modulesKnown) return true;
    return enabledModules.includes(key);
  };

  const orgHasModule = (key: ModuleKey): boolean => {
    if (isGhost) return true;
    if (!modulesKnown) return true;
    const effective = orgEnabledModules.length > 0 ? orgEnabledModules : enabledModules;
    return effective.includes(key);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userLevel,
        userData,
        enterpriseSettings,
        patrolPermissions: userData?.patrol_permissions,
        orgRoles,
        isOrgLeader,
        isOrgHead,
        isUnitHead,
        primaryOrgRole,
        hasOrgRole,
        enabledModules,
        orgEnabledModules,
        modulesKnown,
        hasModule,
        orgHasModule,
        refreshModules,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
