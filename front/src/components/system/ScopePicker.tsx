"use client";

import { useEffect, useState } from "react";
import { getOrganizations } from "@/app/actions/organization/getOrganizations";
import { getUnits } from "@/app/actions/unit/getUnits";
import { unwrapApiResponse } from "@/utils/api-response";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import type { OrganizationListItem, UnitListItem } from "@/services/org-projections";

/**
 * Scope indicator for a panel header.
 *
 * Org members see a read-only chip (their scope comes from `user.roles`).
 * Ghost/Manager hold no org role, so they get a picker instead — choosing an
 * organization (and, for unit-level panels, a unit) is what makes `/orghead`
 * and `/unit-head` usable for them.
 */
export function ScopePicker({
  scopeKind,
}: {
  scopeKind: "organization" | "unit";
}) {
  const {
    orgId,
    orgName,
    unitId,
    unitName,
    isManagerScope,
    selectOrg,
    selectUnit,
  } = usePanelScope();

  const [orgs, setOrgs] = useState<OrganizationListItem[]>([]);
  const [units, setUnits] = useState<UnitListItem[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    if (!isManagerScope) return;
    let alive = true;
    void (async () => {
      try {
        const data = unwrapApiResponse<OrganizationListItem[]>(
          await getOrganizations({ set: { limit: 200 } }),
        );
        if (alive) setOrgs(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setOrgs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isManagerScope]);

  useEffect(() => {
    if (!isManagerScope || scopeKind !== "unit" || !orgId) {
      setUnits([]);
      return;
    }
    let alive = true;
    setLoadingUnits(true);
    void (async () => {
      try {
        const data = unwrapApiResponse<UnitListItem[]>(
          await getUnits({ set: { organizationId: orgId, limit: 200 } }),
        );
        if (alive) setUnits(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setUnits([]);
      } finally {
        if (alive) setLoadingUnits(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isManagerScope, scopeKind, orgId]);

  if (!isManagerScope) {
    const label =
      scopeKind === "unit" && unitName
        ? unitName
        : orgName || unitName || "بدون محدوده";
    const sub = scopeKind === "unit" && unitName && orgName ? orgName : undefined;
    return (
      <span
        className="hidden rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-300 sm:inline-flex sm:items-center sm:gap-2"
        title={sub}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="انتخاب سازمان"
        value={orgId || ""}
        onChange={(event) => selectOrg(event.target.value)}
        className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-blue-400/40"
      >
        <option value="">انتخاب سازمان…</option>
        {orgs.map((org) => (
          <option key={org._id} value={org._id}>
            {org.name}
          </option>
        ))}
      </select>

      {scopeKind === "unit" && orgId && (
        <select
          aria-label="انتخاب واحد"
          value={unitId || ""}
          disabled={loadingUnits}
          onChange={(event) => selectUnit(event.target.value)}
          className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-blue-400/40 disabled:opacity-50"
        >
          <option value="">{loadingUnits ? "در حال بارگذاری…" : "انتخاب واحد…"}</option>
          {units.map((unit) => (
            <option key={unit._id} value={unit._id}>
              {unit.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
