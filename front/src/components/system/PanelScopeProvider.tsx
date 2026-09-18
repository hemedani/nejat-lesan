"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getUnit } from "@/app/actions/unit/getUnit";
import { getOrganization } from "@/app/actions/organization/getOrganization";
import { unwrapApiResponse } from "@/utils/api-response";
import type { RoleName, UserRole } from "@/types/auth";

/**
 * Panel scope
 * -----------
 * Panels live at flat URLs (`/orghead`, `/unit-head`, `/employee`) instead of
 * `/org/[orgId]/…`. The organization (and, for unit-level panels, the unit) is
 * derived from the caller's scoped roles:
 *
 *   role.scopeType === "organization" → that org
 *   role.scopeType === "unit"         → that unit, then its organization
 *
 * Ghost/Manager hold no org role, so they pick a scope explicitly; the choice
 * is kept in sessionStorage for the rest of the session. A panel therefore
 * never needs the viewer to know an internal id up front.
 */

export type ScopePreference = "organization" | "unit" | "any";

interface PanelUnit {
  _id: string;
  name?: string;
  type?: string;
  organization?: { _id?: string; name?: string };
}

interface PanelOrganization {
  _id: string;
  name?: string;
  code?: string;
}

interface PanelScopeValue {
  /** False until auth is hydrated and the scope lookup settled. */
  ready: boolean;
  orgId?: string;
  orgName?: string;
  unitId?: string;
  unitName?: string;
  unitType?: string;
  /** The scoped role that produced this scope, when there is one. */
  role?: UserRole;
  roleName?: RoleName;
  /** True when the viewer is Ghost/Manager rather than an org member. */
  isManagerScope: boolean;
  /** A manager with no scope chosen yet — the shell should ask for one. */
  needsOrgSelection: boolean;
  error?: string;
  selectOrg: (orgId: string) => void;
  selectUnit: (unitId: string) => void;
}

const PanelScopeContext = createContext<PanelScopeValue | undefined>(undefined);

export const usePanelScope = (): PanelScopeValue => {
  const context = useContext(PanelScopeContext);
  if (context === undefined) {
    throw new Error("usePanelScope must be used within a PanelScopeProvider");
  }
  return context;
};

const STORAGE_KEY = "lesan_panel_scope";

type StoredScope = { orgId?: string; unitId?: string };

const readStored = (): StoredScope => {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredScope) : {};
  } catch {
    return {};
  }
};

const writeStored = (scope: StoredScope) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(scope));
  } catch {
    // Storage unavailable (private mode) — scope simply will not persist.
  }
};

function pickRole(roles: UserRole[] | undefined, prefer: ScopePreference): UserRole | undefined {
  const scoped = (roles || []).filter((role) => Boolean(role.scopeType && role.scopeId));
  if (scoped.length === 0) return undefined;
  if (prefer === "organization") {
    return scoped.find((role) => role.scopeType === "organization") ?? scoped[0];
  }
  if (prefer === "unit") {
    return scoped.find((role) => role.scopeType === "unit") ?? scoped[0];
  }
  return scoped[0];
}

export function PanelScopeProvider({
  prefer = "any",
  children,
}: {
  prefer?: ScopePreference;
  children: ReactNode;
}) {
  const { authReady, userData, userLevel } = useAuth();
  const [manual, setManual] = useState<StoredScope>(() => readStored());
  const [unit, setUnit] = useState<PanelUnit | null>(null);
  const [org, setOrg] = useState<PanelOrganization | null>(null);
  const [unitLoading, setUnitLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const isManagerScope = userLevel === "Ghost" || userLevel === "Manager";

  const role = useMemo(() => pickRole(userData?.roles, prefer), [userData, prefer]);

  const roleOrgId = role?.scopeType === "organization" ? role.scopeId : undefined;
  const roleUnitId = role?.scopeType === "unit" ? role.scopeId : undefined;

  const unitId = roleUnitId ?? manual.unitId;
  const orgId = roleOrgId ?? manual.orgId ?? unit?.organization?._id;

  // Load the unit record — it also yields the parent organization.
  useEffect(() => {
    if (!authReady || !unitId) {
      setUnit(null);
      return;
    }
    if (unit?._id === unitId) return;

    let alive = true;
    setUnitLoading(true);
    setError(undefined);

    void (async () => {
      try {
        const data = unwrapApiResponse<PanelUnit>(await getUnit({ set: { _id: unitId } }));
        if (alive) setUnit(data ?? null);
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : undefined);
      } finally {
        if (alive) setUnitLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authReady, unitId, unit?._id]);

  // Load the organization record for its display name.
  useEffect(() => {
    if (!authReady || !orgId) {
      setOrg(null);
      return;
    }
    if (org?._id === orgId) return;

    let alive = true;
    setOrgLoading(true);

    void (async () => {
      try {
        const data = unwrapApiResponse<PanelOrganization>(
          await getOrganization({ set: { _id: orgId }, get: { _id: 1, name: 1, code: 1 } }),
        );
        if (alive) setOrg(data ?? null);
      } catch {
        // A missing name is cosmetic — ids remain usable.
      } finally {
        if (alive) setOrgLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [authReady, orgId, org?._id]);

  const selectOrg = useCallback((nextOrgId: string) => {
    const next: StoredScope = { orgId: nextOrgId };
    writeStored(next);
    setManual(next);
    setUnit(null);
  }, []);

  const selectUnit = useCallback((nextUnitId: string) => {
    const next: StoredScope = { unitId: nextUnitId };
    writeStored(next);
    setManual(next);
  }, []);

  const value: PanelScopeValue = {
    ready: authReady && !unitLoading && !orgLoading,
    orgId,
    orgName: org?.name,
    unitId,
    unitName: unit?.name,
    unitType: unit?.type,
    role,
    roleName: role?.name,
    isManagerScope,
    needsOrgSelection: isManagerScope && !orgId && !unitId,
    error,
    selectOrg,
    selectUnit,
  };

  return <PanelScopeContext.Provider value={value}>{children}</PanelScopeContext.Provider>;
}
