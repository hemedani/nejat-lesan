"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getUnit } from "@/app/actions/unit/getUnit";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { PageSkeleton, RetryErrorBox, EmptyState } from "@/components/patrol/ui";
import { ORG_ROLE_LABELS, ORG_ROLE_TONES } from "@/components/org/role-helpers";
import type { UserRole } from "@/types/auth";
import { unitHeadRoutes } from "@/utils/unit-head-routes";

interface Member {
  _id: string;
  first_name?: string;
  last_name?: string;
  personnel_code?: string;
  mobile?: string;
  email?: string;
  level?: string;
  roles?: UserRole[];
}

interface UnitDetail {
  _id: string;
  name?: string;
  organization?: { _id?: string; name?: string };
  officers?: Member[];
}

const LEVEL_LABELS: Record<string, string> = {
  Ghost: "دسترسی کامل",
  Manager: "مدیر",
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Editor: "ویرایشگر",
  Enterprise: "کاربر سازمانی",
  Patrol: "مأمور گشت",
};

/**
 * Members of the unit under the UnitHead's supervision.
 *
 * Read-only by design: membership and role assignment are owned by
 * `user.addOrRemoveRoles`, which the backend gates to Manager/OrgHead/UnitHead —
 * the OrgHead panel is where those changes are made, so the UnitHead gets a
 * clear view plus a link instead of a duplicate editor.
 */
export function UnitMembersView({ unitId }: { unitId: string }) {
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = unwrapApiResponse<UnitDetail>(await getUnit({ set: { _id: unitId } }));
      setUnit(detail);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton blocks={[120, 220]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;
  if (!unit) return null;

  const members = Array.isArray(unit.officers) ? unit.officers : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">واحد من</p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            اعضای «{unit.name || "واحد"}»
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {members.length.toLocaleString("fa-IR")} عضو در این واحد ثبت شده است.
          </p>
        </div>
        <Link
          href={unitHeadRoutes.dashboard()}
          className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/10"
        >
          بازگشت به داشبورد
        </Link>
      </div>

      {members.length === 0 ? (
        <EmptyState message="عضوی برای این واحد ثبت نشده است." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-white/10 text-xs text-slate-500">
                <tr>
                  {["نام و نام خانوادگی", "کد پرسنلی", "سطح", "نقش‌ها", "تماس"].map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-3 font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {members.map((member) => (
                  <tr key={member._id}>
                    <td className="px-4 py-3 font-medium text-white">
                      {`${member.first_name || ""} ${member.last_name || ""}`.trim() || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                      {member.personnel_code || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {LEVEL_LABELS[member.level || ""] || member.level || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {(member.roles || []).length === 0 && (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                        {(member.roles || []).map((role) => (
                          <RoleChip key={role.roleId || `${role.name}-${role.scopeId}`} role={role} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {member.mobile && <span dir="ltr">{member.mobile}</span>}
                      {member.email && (
                        <span className="block text-slate-500" dir="ltr">
                          {member.email}
                        </span>
                      )}
                      {!member.mobile && !member.email && "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleChip({ role }: { role: UserRole }) {
  const label =
    ORG_ROLE_LABELS[role.name as keyof typeof ORG_ROLE_LABELS] || role.name;
  const tone =
    ORG_ROLE_TONES[role.name] || "border-white/10 bg-white/[.04] text-slate-300";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] ${tone}`} title={role.scopeId}>
      {label}
    </span>
  );
}
