"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/atoms/Button";

interface WorkspaceLink {
  href: string;
  label: string;
}

export function PatrolWorkspace({
  children,
  manager = false,
}: {
  children: React.ReactNode;
  manager?: boolean;
}) {
  const pathname = usePathname();
  const { userData, logout } = useAuth();

  const links: WorkspaceLink[] = manager
    ? [
        { href: "/patrol-manager/dashboard", label: "نمای کلی" },
        { href: "/patrol-manager/reports", label: "صف گزارش‌ها" },
        ...(["Ghost", "Manager"].includes(userData?.level || "")
          ? [{ href: "/patrol-manager/operations", label: "مدیریت عملیات گشت" }]
          : []),
      ]
    : [
        { href: "/patrol/dashboard", label: "داشبورد من" },
        { href: "/patrol/reports", label: "گزارش‌های من" },
      ];

  const name =
    [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") ||
    "کاربر";

  return (
    <div
      className="admin-shell min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100"
      dir="rtl"
    >
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:3rem_3rem]" />
      <div className="relative mx-auto flex w-full max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 rounded-2xl border border-white/10 bg-slate-900/75 p-3 shadow-2xl backdrop-blur-xl lg:block">
          <div className="mb-5 border-b border-white/10 px-3 pb-4">
            <p className="text-xs text-blue-300">سامانه مرصاد</p>
            <h1 className="mt-1 text-lg font-bold text-white">
              {manager ? "مرکز بررسی گشت" : "پنل مأمور گشت"}
            </h1>
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
              <span className="hidden sm:inline">
                {userData?.personnel_code || "کد پرسنلی ثبت نشده"}
              </span>
              <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-blue-200">
                {manager ? "مدیر" : "مأمور گشت"}
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
  );
}

export function RoleNotice({ message = "شما به این بخش دسترسی ندارید." }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-8 text-center text-rose-100">
      {message}
    </div>
  );
}
