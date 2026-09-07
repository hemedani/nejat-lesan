"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type NavItem = { href: string; label: string; description?: string };

const corePublicItems: NavItem[] = [{ href: "/", label: "خانه" }];

const roleLabels: Record<string, string> = {
  Ghost: "دسترسی کامل مدیریتی",
  Manager: "مدیریت و بررسی گزارش‌ها",
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Editor: "ویرایش داده‌های سامانه",
  Enterprise: "دسترسی سازمانی",
  Patrol: "ثبت و پیگیری گزارش‌های گشت",
};

export const Navbar = () => {
  const { isAuthenticated, userLevel, userData, hasModule, orgHasModule, isOrgLeader, isOrgHead, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelsOpen, setPanelsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const panelsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const displayName = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر";

  const chartsEnabled = hasModule("charts");
  const patrolEnabled = orgHasModule("incident_patrol");

  const publicItems: NavItem[] = [
    ...corePublicItems,
    ...(chartsEnabled
      ? [
          { href: "/charts/overall", label: "تحلیل‌ها", description: "نمودارها و گزارش‌های تحلیلی" },
          { href: "/maps/accidents", label: "نقشه تصادفات", description: "مشاهده رخدادها روی نقشه" },
        ]
      : []),
  ];

  // Panel selector ("پنل‌ها"): one clear destination per persona/role.
  const panelItems: NavItem[] = [];

  // Org-head / unit-head workspace — distinct labeled entries per role.
  if (patrolEnabled && isOrgLeader) {
    panelItems.push({
      href: "/org",
      label: isOrgHead ? "داشبورد سرپرست سازمان" : "داشبورد سرپرست واحد",
      description: isOrgHead
        ? "نمودار سازمان، واحدها، افراد، فرایندها و رخدادهای سازمان خودتان"
        : "مدیریت واحد تحت سرپرستی، اعضا، فرایندها و رخدادهای آن",
    });
  }

  // Patrol officer panel.
  if (patrolEnabled && userLevel === "Patrol") {
    panelItems.push({ href: "/patrol/dashboard", label: "داشبورد مأمور گشت", description: "شیفت و گزارش‌های من" });
  }

  // Manager review center (patrol incident review).
  if (patrolEnabled && (userLevel === "Ghost" || userLevel === "Manager")) {
    panelItems.push({ href: "/patrol-manager/dashboard", label: "مرکز بررسی گشت", description: "صف بررسی گزارش‌های مأموران" });
  }

  // Main admin panel (org management lives in its sidebar → no duplicate entry).
  if (userLevel === "Ghost" || userLevel === "Manager" || userLevel === "Editor") {
    panelItems.push({ href: "/admin", label: "پنل مدیریت سامانه", description: "سازمان‌ها، کاربران و داده‌های پایه" });
  }

  // Ghost-only module licensing.
  if (userLevel === "Ghost") {
    panelItems.push({ href: "/admin/modules", label: "تنظیمات ماژول‌ها", description: "فعال/غیرفعال کردن ماژول‌ها (نصب و سازمان)" });
  }

  if (isAuthenticated) panelItems.push({ href: "/user", label: "پنل کاربری", description: "اطلاعات حساب و تنظیمات" });

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelsRef.current?.contains(target)) setPanelsOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setPanelsOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-[9999] border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="flex min-w-0 items-center gap-7">
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="مرصاد، صفحه اصلی">
            <Image src="/logo.png" alt="مرصاد" width={38} height={38} className="object-contain transition-transform group-hover:scale-105" />
            <span className="hidden text-sm font-bold text-white sm:block">مرصاد</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {publicItems.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2 text-sm transition ${pathname === item.href ? "bg-blue-500/15 text-blue-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{item.label}</Link>)}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {panelItems.length > 0 && <div className="relative" ref={panelsRef}>
            <button onClick={() => setPanelsOpen((open) => !open)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${panelsOpen ? "border-blue-400/40 bg-blue-400/10 text-blue-100" : "border-white/10 text-slate-300 hover:bg-white/5"}`} aria-expanded={panelsOpen}>
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" />
              پنل‌ها
              <Chevron open={panelsOpen} />
            </button>
            {panelsOpen && <PanelMenu items={panelItems} pathname={pathname} onNavigate={() => setPanelsOpen(false)} />}
          </div>}
          {isAuthenticated ? <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white" aria-expanded={profileOpen}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-400/30 bg-blue-400/10 text-xs font-bold text-blue-100">{displayName.slice(0, 1)}</span>
              <span className="max-w-28 truncate">{displayName}</span><Chevron open={profileOpen} />
            </button>
            {profileOpen && <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"><div className="border-b border-white/10 bg-white/[.03] p-4"><p className="font-semibold text-white">{displayName}</p><p className="mt-1 text-xs text-slate-500">{roleLabels[userLevel || ""] || "حساب کاربری"}</p>{userData?.email && <p className="mt-2 truncate text-xs text-slate-400" dir="ltr">{userData.email}</p>}</div><button onClick={logout} className="w-full px-4 py-3 text-right text-sm text-rose-200 transition hover:bg-rose-400/10">خروج از حساب</button></div>}
          </div> : <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_22px_rgba(37,99,235,.25)] transition hover:bg-blue-500">ورود به سامانه</Link>}
        </div>

        <button onClick={() => setMenuOpen((open) => !open)} className="rounded-xl border border-white/10 p-2 text-slate-300 md:hidden" aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}>
          <span className="block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" />
        </button>
      </div>
      {menuOpen && <div className="border-t border-white/10 bg-slate-900 px-4 py-4 md:hidden" dir="rtl"><div className="space-y-1">{publicItems.map((item) => <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5">{item.label}</Link>)}</div>{panelItems.length > 0 && <div className="mt-3 border-t border-white/10 pt-3"><p className="px-3 pb-2 text-xs text-slate-500">پنل‌های در دسترس</p><PanelMenu items={panelItems} pathname={pathname} onNavigate={() => setMenuOpen(false)} mobile /> </div>}{isAuthenticated && <button onClick={logout} className="mt-3 w-full rounded-xl border border-rose-400/20 px-3 py-3 text-right text-sm text-rose-200">خروج از حساب</button>}</div>}
    </header>
  );
};

function PanelMenu({ items, pathname, onNavigate, mobile = false }: { items: NavItem[]; pathname: string; onNavigate: () => void; mobile?: boolean }) {
  return <div className={mobile ? "space-y-1" : "absolute left-0 mt-2 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl"}>{items.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className={`block rounded-xl px-3 py-3 transition ${pathname.startsWith(item.href.split("/").slice(0, 2).join("/")) ? "bg-blue-500/10 text-blue-100" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}><span className="block text-sm font-medium">{item.label}</span>{item.description && <span className="mt-1 block text-xs text-slate-500">{item.description}</span>}</Link>)}</div>;
}

function Chevron({ open }: { open: boolean }) { return <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m6 9 6 6 6-6" /></svg>; }
