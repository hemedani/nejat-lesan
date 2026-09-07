"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUsers } from "@/app/actions/user/getUsers";
import { CountUsers } from "@/app/actions/user/countUsers";
import { getUnits } from "@/app/actions/unit/getUnits";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { UnitListItem } from "@/services/org-projections";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import {
  ORG_ROLE_LABELS,
  ORG_ROLE_TONES,
  scopeLabel,
  type OrgRoleRow,
} from "@/components/org/role-helpers";

interface Member {
  _id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  personnel_code?: string;
  level?: string;
  roles?: OrgRoleRow[];
}

const MEMBER_GET = {
  _id: 1,
  first_name: 1,
  last_name: 1,
  email: 1,
  mobile: 1,
  personnel_code: 1,
  level: 1,
  roles: 1,
  is_active: 1,
} as const;

export function PeopleListView({ orgId }: { orgId: string }) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [units, setUnits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = (await getUsers({
        set: { organizationId: orgId, page: 1, limit: 200 },
        get: MEMBER_GET,
      })) as Member[] | undefined;
      const counted = (await CountUsers({
        set: { organizationId: orgId },
        get: { qty: 1 },
      })) as { qty?: number } | undefined;
      const unitRows = unwrapApiResponse<UnitListItem[]>(
        await getUnits({ set: { organizationId: orgId, limit: 200 } }),
      );
      setMembers(Array.isArray(data) ? data : []);
      setTotal(counted?.qty ?? (Array.isArray(data) ? data.length : 0));
      const map: Record<string, string> = {};
      if (Array.isArray(unitRows)) {
        for (const u of unitRows) map[u._id] = u.name;
      }
      setUnits(map);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${m.first_name || ""} ${m.last_name || ""} ${m.email || ""} ${m.personnel_code || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [members, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { OrgHead: 0, UnitHead: 0, Officer: 0 };
    for (const m of members) {
      for (const role of m.roles || []) {
        if (role.scopeType === "organization" && role.scopeId === orgId && c[role.name] !== undefined) c[role.name] += 1;
        else if (role.scopeType === "unit" && c[role.name] !== undefined) c[role.name] += 1;
      }
    }
    return c;
  }, [members, orgId]);

  return (
    <div>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">افراد و نقش‌ها</p>
          <h1 className="mt-1 text-2xl font-bold text-white">اعضای سازمان</h1>
          <p className="mt-2 text-sm text-slate-500">افراد را اضافه کنید و نقش سازمانی (سرپرست سازمان/واحد یا مامور) به آن‌ها بدهید.</p>
        </div>
        <Link href={`/org/${orgId}/people/add`} className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-500">
          + افزودن فرد
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="کل اعضا" value={total.toLocaleString("fa-IR")} />
        <Kpi label="سرپرستان سازمان" value={counts.OrgHead.toLocaleString("fa-IR")} />
        <Kpi label="سرپرستان واحد" value={counts.UnitHead.toLocaleString("fa-IR")} />
        <Kpi label="ماموران" value={counts.Officer.toLocaleString("fa-IR")} />
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی نام، ایمیل یا کد پرسنلی..."
          className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50"
        />
      </div>

      {loading ? (
        <PageSkeleton blocks={[120, 120]} />
      ) : error ? (
        <RetryErrorBox message={error} onRetry={() => void load()} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center text-sm text-slate-500">
          فردی یافت نشد.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <button
              key={member._id}
              onClick={() => router.push(`/org/${orgId}/people/${member._id}`)}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-right transition hover:border-blue-400/25"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 font-bold text-blue-100">
                  {`${member.first_name || ""} ${member.last_name || ""}`.trim().slice(0, 1) || "؟"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[11px] text-slate-400">
                  {member.level || "—"}
                </span>
              </div>
              <p className="mt-3 font-semibold text-white">
                {`${member.first_name || ""} ${member.last_name || ""}`.trim() || "بدون نام"}
              </p>
              {member.email && <p className="mt-0.5 text-xs text-slate-400" dir="ltr">{member.email}</p>}
              {(member.personnel_code || member.mobile) && (
                <p className="mt-1 text-xs text-slate-500" dir="ltr">{member.personnel_code || member.mobile}</p>
              )}
              {(member.roles?.length || 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {member.roles!.map((role, i) => (
                    <span key={`${role.name}-${i}`} className={`rounded-full border px-2 py-0.5 text-[10px] ${ORG_ROLE_TONES[role.name] || ""}`}>
                      {ORG_ROLE_LABELS[role.name] || role.name}
                      {scopeLabel(role, units, orgId) ? ` · ${scopeLabel(role, units, orgId)}` : ""}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-xl">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
