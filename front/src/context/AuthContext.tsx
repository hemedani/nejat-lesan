"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type {
  UserLevel,
  UserData,
  EnterpriseSettings,
  ModuleKey,
  ModuleFeed,
  UserRole,
  RoleName,
} from "@/types/auth";
import { getModules } from "@/app/actions/app_modules/getModules";
import { getMe } from "@/app/actions/user/getMe";
import {
  clearAuthToken,
  clearCachedModuleFeed,
  clearCachedUser,
  getAuthToken,
  purgeLegacyAuthArtifacts,
  readCachedModuleFeed,
  readCachedUser,
  setAuthToken,
  writeCachedModuleFeed,
  writeCachedUser,
} from "@/utils/auth-storage";

const ORG_ROLE_NAMES: RoleName[] = ["OrgHead", "UnitHead", "Officer"];
const SESSION_VALIDATION_TIMEOUT_MS = 8000;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("session-validation-timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
};

interface MeBody extends UserData {
  modules?: string[];
  orgModules?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  /** False until the session has been read from cookies/localStorage. */
  authReady: boolean;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [userLevel, setUserLevel] = useState<UserLevel>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [enterpriseSettings, setEnterpriseSettings] = useState<EnterpriseSettings | undefined>(undefined);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [orgEnabledModules, setOrgEnabledModules] = useState<string[]>([]);
  const [modulesKnown, setModulesKnown] = useState<boolean>(false);
  const router = useRouter();

  const applyModuleFeed = useCallback((feed: ModuleFeed | null | undefined) => {
    if (Array.isArray(feed?.modules)) {
      setEnabledModules(feed.modules);
      setModulesKnown(true);
    }
    if (Array.isArray(feed?.orgModules)) {
      setOrgEnabledModules(feed.orgModules);
    }
  }, []);

  const applyIdentity = useCallback((user: UserData) => {
    setIsAuthenticated(true);
    setUserLevel(user.level);
    setUserData(user);
    setEnterpriseSettings(user.settings);
  }, []);

  const clearAuthState = useCallback(() => {
    setIsAuthenticated(false);
    setUserLevel(null);
    setUserData(null);
    setEnterpriseSettings(undefined);
    setEnabledModules([]);
    setOrgEnabledModules([]);
    setModulesKnown(false);
  }, []);

  const clearSession = useCallback(() => {
    clearAuthToken();
    clearCachedUser();
    clearCachedModuleFeed();
    clearAuthState();
  }, [clearAuthState]);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      purgeLegacyAuthArtifacts();

      if (!getAuthToken()) {
        clearSession();
        if (!cancelled) setAuthReady(true);
        return;
      }

      const cachedUser = readCachedUser();
      const cachedFeed = readCachedModuleFeed();

      try {
        const response = await withTimeout(getMe(), SESSION_VALIDATION_TIMEOUT_MS);
        if (cancelled) return;

        const body = response?.body as MeBody | undefined;
        if (response?.success && body) {
          applyIdentity(body);
          writeCachedUser(body);

          const feed: ModuleFeed = {
            modules: Array.isArray(body.modules) ? body.modules : cachedFeed?.modules,
            orgModules: Array.isArray(body.orgModules) ? body.orgModules : cachedFeed?.orgModules,
          };
          applyModuleFeed(feed);
          writeCachedModuleFeed(feed);
        } else {
          clearSession();
        }
      } catch {
        if (cachedUser) {
          applyIdentity(cachedUser);
          applyModuleFeed(cachedFeed);
        } else {
          clearSession();
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [applyIdentity, applyModuleFeed, clearSession]);

  const login = (token: string, user: UserData, moduleFeed?: ModuleFeed) => {
    setAuthToken(token);
    applyIdentity(user);
    writeCachedUser(user);

    const feed: ModuleFeed = moduleFeed ?? {
      modules: user.modules,
      orgModules: user.orgModules,
    };
    applyModuleFeed(feed);
    writeCachedModuleFeed(feed);
  };

  const logout = () => {
    clearSession();
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
        authReady,
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
