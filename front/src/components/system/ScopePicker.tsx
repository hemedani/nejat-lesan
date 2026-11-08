"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "@/app/actions/organization/getOrganizations";
import { getUnits } from "@/app/actions/unit/getUnits";
import { unwrapApiResponse } from "@/utils/api-response";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import SelectBox from "@/components/atoms/Select";
import type { OrganizationListItem, UnitListItem } from "@/services/org-projections";

/**
 * Scope indicator for a panel header.
 *
 * Org members see a read-only chip (their scope comes from `user.roles`).
 * Ghost/Manager hold no org role, so they get a picker instead — choosing an
 * organization (and, for unit-level panels, a unit) is what makes `/orghead`
 * and `/unit-head` usable for them.
 *
 * Both pickers are the project-standard `SelectBox` rather than a native
 * `<select>`: the header is the first control a Ghost meets, and the org list is
 * a request that can be slow or fail. A native select has nowhere to put either
 * state — it renders an empty, apparently-ready list — so the fetch states are
 * carried on the control itself (`loading` → spinner + «در حال بارگذاری…»,
 * failure → the message underneath).
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
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [orgsError, setOrgsError] = useState<string | undefined>(undefined);
  const [unitsError, setUnitsError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isManagerScope) return;
    let alive = true;
    setLoadingOrgs(true);
    setOrgsError(undefined);
    void (async () => {
      try {
        const data = unwrapApiResponse<OrganizationListItem[]>(
          await getOrganizations({ set: { limit: 200 } }),
        );
        if (alive) setOrgs(Array.isArray(data) ? data : []);
      } catch {
        if (alive) {
          setOrgs([]);
          setOrgsError("فهرست سازمان‌ها خوانده نشد.");
        }
      } finally {
        if (alive) setLoadingOrgs(false);
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
    setUnitsError(undefined);
    void (async () => {
      try {
        const data = unwrapApiResponse<UnitListItem[]>(
          await getUnits({ set: { organizationId: orgId, limit: 200 } }),
        );
        if (alive) setUnits(Array.isArray(data) ? data : []);
      } catch {
        if (alive) {
          setUnits([]);
          setUnitsError("فهرست واحدها خوانده نشد.");
        }
      } finally {
        if (alive) setLoadingUnits(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isManagerScope, scopeKind, orgId]);

  // Built once per fetch rather than inline: the panel header re-renders on every
  // navigation and scope change, and react-select re-derives its menu whenever the
  // `options` identity changes — a fresh array per render would rebuild it each time.
  const orgOptions = useMemo(
    () => orgs.map((org) => ({ value: org._id, label: org.name || org._id })),
    [orgs],
  );
  const unitOptions = useMemo(
    () => units.map((unit) => ({ value: unit._id, label: unit.name || unit._id })),
    [units],
  );

  if (!isManagerScope) {
    const label =
      scopeKind === "unit" && unitName
        ? unitName
        : orgName || unitName || "بدون محدوده";
    const sub = scopeKind === "unit" && unitName && orgName ? orgName : undefined;
    return (
      <span
        className="hidden rounded-full border border-line bg-surface-sunken px-3 py-1.5 text-xs text-fg-muted sm:inline-flex sm:items-center sm:gap-2"
        title={sub}
      >
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <SelectBox
        ariaLabel="انتخاب سازمان"
        value={orgId || ""}
        onValueChange={selectOrg}
        options={orgOptions}
        placeholder="انتخاب سازمان…"
        loading={loadingOrgs}
        clearable={false}
        errMsg={orgsError}
        className="min-w-44"
      />

      {scopeKind === "unit" && orgId && (
        <SelectBox
          ariaLabel="انتخاب واحد"
          value={unitId || ""}
          onValueChange={selectUnit}
          options={unitOptions}
          placeholder="انتخاب واحد…"
          loading={loadingUnits}
          disabled={loadingUnits}
          clearable={false}
          errMsg={unitsError}
          className="min-w-40"
        />
      )}
    </div>
  );
}
