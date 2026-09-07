"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/atoms/Button";
import { ModuleGate } from "@/components/system/ModuleGate";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";

interface WorkspaceLink {
  href: string;
  label: string;
}

export function OrgWorkspace({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userLevel, isOrgLeader, userData, logout } = useAuth();

  const manager = userLevel === "Ghost" || userLevel === "Manager";
  const allowed = manager || isOrgLeader;

  const parts = pathname.split("/").filter(Boolean);
  const orgId = parts[0] === "org" && parts.length >= 2 ? parts[1] : undefined;

  const name = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر";

  if (!allowed) {
    return <RoleNotice message="داشبورد سازمان فقط برای سرپرست سازمان یا مدیران سیستم در دسترس است." />;
  }

  const links: WorkspaceLink[] = [
    { href: "/org", label: isOrgLeader ? "سازمان من" : "سازمان‌ها" },
    ...(orgId
      ? [
          { href: `/org/${orgId}`, label: "نمای کلی سازمان" },
          { href: `/org/${orgId}/org-chart`, label: "نمودار سازمانی" },
          { href: `/org/${orgId}/units`, label: "واحدها" },
          { href: `/org/${orgId}/people`, label: "افراد و نقش‌ها" },
          { href: `/org/${orgId}/processes`, label: "فرایندهای ثبت رخداد" },
          { href: `/org/${orgId}/inventory`, label: "انبار و موجودی" },
          { href: `/org/${orgId}/reports`, label: "گزارش‌های رخداد" },
        ]
      : []),
  ];

  const roleChip = manager
    ? "مدیر"
    : userLevel === "OrgHead"
      ? "سرپرست سازمان"
      : userLevel === "UnitHead"
        ? "سرپرست واحد"
        : "سازمانی";

  return (
    <ModuleGate module="incident_patrol">
      <div className="admin-shell min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100" dir="rtl">
        <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:3rem_3rem]" />
        <div className="relative mx-auto flex w-full max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <aside className="hidden w-60 shrink-0 rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-2xl backdrop-blur-xl lg:block">
            <div className="mb-5 border-b border-white/10 px-3 pb-4">
              <p className="text-xs text-blue-300">سامانه مرصاد</p>
              <h1 className="mt-1 text-lg font-bold text-white">داشبورد سازمان</h1>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">نمودار سازمانی، واحدها، فرایندها و رخدادهای سازمان</p>
            </div>
            <nav className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-3 py-3 text-sm transition ${
                    pathname === link.href
                      ? "bg-blue-500/15 text-blue-200 shadow-[0_0_20px_rgba(37,99,235,.12)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Button variant="danger" fullWidth className="mt-8 justify-start" onClick={logout}>
              خروج از حساب
            </Button>
          </aside>
          <main className="min-w-0 flex-1">
            <header className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 px-4 py-3 shadow-xl backdrop-blur-xl sm:px-5">
              <div>
                <p className="text-xs text-slate-500">فضای کاری</p>
                <p className="font-semibold text-white">{name}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-blue-200">
                  {roleChip}
                </span>
              </div>
            </header>
            <div className="mb-5 flex gap-2 overflow-x-auto lg:hidden">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition ${
                    pathname === link.href
                      ? "border-blue-400/40 bg-blue-400/10 text-blue-200"
                      : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {children}
          </main>
        </div>
      </div>
    </ModuleGate>
  );
}
