"use client";

import { useAuth } from "@/context/AuthContext";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import { LEVEL_LABELS } from "@/utils/panels";
import { MODULE_KEYS, MODULE_LABELS } from "@/utils/org";

/**
 * The profile panel.
 *
 * This page used to render a hardcoded name and email, four invented usage
 * statistics and three invented activity entries, while reading only
 * `hasModule("charts")` from auth and
 * ignoring `userData` entirely. It is the `getDefaultPanel` fallback, so an
 * authenticated user with no matching role landed on a page of fiction about
 * themselves — and its quick-access cards linked to `/admin`, which then
 * redirected them straight back out.
 *
 * Everything below comes from a real source or is not shown. There is no
 * endpoint for usage statistics or an activity feed, so those sections are gone
 * rather than reworded: an empty state would promise something the backend does
 * not provide, and a number would be a lie.
 */

const ROLE_LABELS: Record<string, string> = {
  Ghost: "دسترسی کامل مدیریتی",
  Manager: "مدیر سامانه",
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Officer: "کارمند",
  Editor: "ویرایشگر داده",
  Enterprise: "کاربر سازمانی",
  Patrol: "مأمور گشت",
};

const SCOPE_LABELS: Record<string, string> = {
  organization: "سازمان",
  unit: "واحد",
};

function displayName(first?: string, last?: string): string {
  return [first, last].filter(Boolean).join(" ").trim() || "کاربر";
}

export default function UserProfilePage() {
  const { userData, userLevel, enabledModules, orgEnabledModules, modulesKnown } = useAuth();
  // Derived rather than read off the context: `AuthContext` keeps `isGhost`
  // private, and widening that surface for one page's convenience is not a trade
  // worth making.
  const isGhost = userLevel === "Ghost";
  const { orgName, unitName } = usePanelScope();

  const roles = userData?.roles ?? [];

  // Which licences apply to this viewer. An org without its own list inherits the
  // installation's, and an unknown feed degrades to "everything on" — the same
  // rule `AuthContext.hasModule` uses. Reporting "on" for a module we have not
  // heard about is the safe direction: it matches what the backend would allow.
  const activeModules = isGhost
    ? MODULE_KEYS
    : !modulesKnown
      ? MODULE_KEYS
      : orgEnabledModules.length > 0
        ? orgEnabledModules
        : enabledModules;

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-line [background-image:var(--hero-gradient)] p-5 shadow-xl sm:p-6">
        <h1 className="text-2xl font-bold text-fg">
          {displayName(userData?.first_name, userData?.last_name)}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {userLevel ? LEVEL_LABELS[userLevel] : "—"}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="ایمیل" value={userData?.email} ltr />
          <Field label="موبایل" value={userData?.mobile} ltr />
          <Field label="کد ملی" value={userData?.national_number} ltr />
          <Field label="کد پرسنلی" value={userData?.personnel_code} ltr />
        </dl>
      </header>

      <section className="rounded-2xl border border-line bg-surface/70 p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-fg">نقش‌ها و محدوده</h2>
        <p className="mt-1 text-xs text-fg-faint">
          نقش‌های ثبت‌شده برای این حساب و محدوده‌ای که هر نقش در آن اعمال می‌شود.
        </p>
        {roles.length === 0 ? (
          <p className="mt-4 text-sm text-fg-faint">
            هیچ نقش سازمانی یا واحدی برای این حساب ثبت نشده است.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {roles.map((role) => {
              const scopeName = role.scopeType === "unit" ? unitName : orgName;
              return (
                <li
                  key={`${role.roleId}-${role.scopeType ?? "none"}-${role.scopeId ?? "none"}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface-sunken px-3 py-2.5"
                >
                  <span className="text-sm text-fg">
                    {ROLE_LABELS[role.name] ?? role.name}
                  </span>
                  <span className="text-xs text-fg-faint">
                    {role.scopeType
                      ? `${SCOPE_LABELS[role.scopeType] ?? role.scopeType}: ${scopeName ?? "—"}`
                      : "بدون محدوده"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface/70 p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-fg">ماژول‌های فعال</h2>
        <p className="mt-1 text-xs text-fg-faint">
          وضعیت قابلیت‌هایی که برای سازمان شما فعال است. تغییر این موارد در اختیار مدیر
          نصب است و از بخش «ماژول‌ها» در پنل مدیریت انجام می‌شود.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {MODULE_KEYS.map((key) => {
            const on = activeModules.includes(key);
            return (
              <li
                key={key}
                className="flex items-center justify-between rounded-xl border border-line bg-surface-sunken px-3 py-2.5"
              >
                <span className="text-xs text-fg-muted">{MODULE_LABELS[key]}</span>
                <span
                  className={
                    on
                      ? "tint-emerald rounded-full border border-tint-border bg-tint-soft px-2 py-0.5 text-[11px] text-tint-fg"
                      : "rounded-full border border-line bg-surface-sunken px-2 py-0.5 text-[11px] text-fg-faint"
                  }
                >
                  {on ? "فعال" : "غیرفعال"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  ltr,
}: {
  label: string;
  value?: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-fg-faint">{label}</dt>
      <dd
        className={`mt-1 text-sm text-fg ${ltr ? "truncate" : ""}`}
        dir={ltr ? "ltr" : undefined}
      >
        {value || "—"}
      </dd>
    </div>
  );
}