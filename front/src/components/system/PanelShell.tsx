"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import { PanelIcon } from "@/components/system/panel-icons";
import { ScopePicker } from "@/components/system/ScopePicker";
import { filterPanelSections, isNavItemActive, PANEL_NAV } from "@/utils/panel-nav";
import { LEVEL_LABELS, type ShellPanelId } from "@/utils/panels";
import { Button } from "@/components/atoms/Button";
import type { RoleName } from "@/types/auth";

const ROLE_CHIP_LABELS: Partial<Record<RoleName, string>> = {
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Officer: "کارمند",
};

/**
 * Shared chrome for every role panel: brand, role-filtered sidebar, header and
 * content area. Replaces the three near-duplicate workspaces the app used to
 * carry (`OrgWorkspace`, `PatrolWorkspace`, ad-hoc admin chrome).
 */
export function PanelShell({
  panel,
  scopeKind = "organization",
  children,
}: {
  panel: ShellPanelId;
  /** Which scope the header should surface. */
  scopeKind?: "organization" | "unit";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { userData, userLevel, logout } = useAuth();
  const viewer = usePanelViewer();
  const { needsOrgSelection, roleName } = usePanelScope();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const nav = PANEL_NAV[panel];
  const sections = filterPanelSections(nav.sections, viewer);

  const name =
    [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر";

  const roleChip =
    userLevel === "Ghost" || userLevel === "Manager"
      ? LEVEL_LABELS[userLevel]
      : (roleName && ROLE_CHIP_LABELS[roleName]) ||
        (userLevel ? LEVEL_LABELS[userLevel] : "کاربر");

  const hasSidebar = sections.length > 0;

  return (
    <div className="admin-shell min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100" dir="rtl">
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:3rem_3rem]" />

      <div className="relative mx-auto flex w-full max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
        {hasSidebar && (
          <aside className="hidden w-60 shrink-0 self-start rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-2xl backdrop-blur-xl lg:sticky lg:top-5 lg:block">
            <div className="mb-5 flex items-start gap-3 border-b border-white/10 px-3 pb-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-200">
                <PanelIcon name={nav.brand.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-blue-300">سامانه مرصاد</p>
                <h1 className="mt-0.5 truncate text-base font-bold text-white">
                  {nav.brand.label}
                </h1>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                  {nav.brand.description}
                </p>
              </div>
            </div>

            <nav className="space-y-4">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 pb-1.5 text-[11px] font-medium text-slate-500">
                    {section.label}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                              active
                                ? "bg-blue-500/15 text-blue-200 shadow-[0_0_20px_rgba(37,99,235,.12)]"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <PanelIcon name={item.icon} className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <Button
              variant="danger"
              fullWidth
              className="mt-8 justify-start"
              onClick={logout}
            >
              <PanelIcon name="logout" className="h-4 w-4" />
              خروج از حساب
            </Button>
          </aside>
        )}

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 px-4 py-3 shadow-xl backdrop-blur-xl sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              {hasSidebar && (
                <button
                  type="button"
                  onClick={() => setMobileNavOpen((open) => !open)}
                  className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/5 lg:hidden"
                  aria-label={mobileNavOpen ? "بستن منو" : "باز کردن منو"}
                  aria-expanded={mobileNavOpen}
                >
                  <PanelIcon name={mobileNavOpen ? "close" : "menu"} className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-xs text-slate-500">فضای کاری</p>
                <p className="truncate font-semibold text-white">{name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <ScopePicker scopeKind={scopeKind} />
              <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-blue-200">
                {roleChip}
              </span>
            </div>
          </header>

          {hasSidebar && mobileNavOpen && (
            <nav className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-slate-900/90 p-3 shadow-xl lg:hidden">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 pb-1 text-[11px] text-slate-500">{section.label}</p>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = isNavItemActive(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                            active
                              ? "bg-blue-500/15 text-blue-200"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <PanelIcon name={item.icon} className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button variant="danger" fullWidth className="justify-start" onClick={logout}>
                <PanelIcon name="logout" className="h-4 w-4" />
                خروج از حساب
              </Button>
            </nav>
          )}

          {hasSidebar && !mobileNavOpen && (
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {sections
                .flatMap((section) => section.items)
                .map((item) => {
                  const active = isNavItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition ${
                        active
                          ? "border-blue-400/40 bg-blue-400/10 text-blue-200"
                          : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          )}

          {needsOrgSelection && (
            <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
              برای مشاهده این پنل، ابتدا از بالای صفحه یک سازمان را انتخاب کنید.
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
