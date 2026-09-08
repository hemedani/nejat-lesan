"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrganizationModules } from "@/app/actions/organization/getModules";
import { useAuth } from "@/context/AuthContext";
import type { ModuleKey } from "@/types/auth";

/**
 * Resolve the *effective* module set for one organization
 * (organization.module_flags intersected with the installation feed).
 *
 * Semantics mirror the rest of the app:
 * - Ghost is always exempt → every module is "on".
 * - No org context (undefined orgId) → every module is "on".
 * - Fetch failure / unknown → degrade to the installation feed (never block).
 *
 * Results are cached per orgId at module scope and in-flight requests are
 * deduplicated, so the org shell, its sidebar, dashboard cards and page
 * gates share a single network round-trip.
 */
type OrgModulesResult = {
  loading: boolean;
  effective: string[];
  has: (key: ModuleKey) => boolean;
};

const cache = new Map<string, string[]>();
const failed = new Set<string>();
const inflight = new Map<string, Promise<string[] | null>>();

async function fetchOrgModules(orgId: string): Promise<string[] | null> {
  const existing = inflight.get(orgId);
  if (existing) return existing;
  const request = (async () => {
    try {
      const response = await getOrganizationModules({ set: { organizationId: orgId } });
      const effective =
        response.success && Array.isArray(response.body?.effective)
          ? (response.body.effective as string[])
          : [];
      cache.set(orgId, effective);
      return effective;
    } catch {
      failed.add(orgId);
      return null;
    } finally {
      inflight.delete(orgId);
    }
  })();
  inflight.set(orgId, request);
  return request;
}

export function useOrgModules(orgId?: string): OrgModulesResult {
  const { userLevel, hasModule } = useAuth();
  const isGhost = userLevel === "Ghost";

  const [effective, setEffective] = useState<string[] | null>(() => {
    if (isGhost || !orgId) return [];
    return cache.get(orgId) ?? null;
  });
  const [loading, setLoading] = useState<boolean>(
    () => !isGhost && !!orgId && !cache.has(orgId),
  );

  useEffect(() => {
    if (isGhost || !orgId) {
      setEffective([]);
      setLoading(false);
      return;
    }
    if (failed.has(orgId) || cache.has(orgId)) {
      setEffective(cache.get(orgId) ?? null);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetchOrgModules(orgId).then((value) => {
      if (!alive) return;
      setEffective(value);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [orgId, isGhost]);

  const has = useCallback(
    (key: ModuleKey): boolean => {
      if (isGhost || !orgId) return true;
      if (effective !== null) return effective.includes(key);
      return hasModule(key);
    },
    [isGhost, orgId, effective, hasModule],
  );

  return { loading, effective: effective ?? [], has };
}
