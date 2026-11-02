"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { getAccessiblePanels } from "@/utils/panels";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";

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
  const { isAuthenticated, userLevel, userData, hasModule, orgHasModule, logout } = useAuth();
  const viewer = usePanelViewer();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelsOpen, setPanelsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const panelsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const displayName = [userData?.first_name, userData?.last_name].filter(Boolean).join(" ") || "کاربر";

  const chartsEnabled = hasModule("charts");

  const publicItems: NavItem[] = [
    ...corePublicItems,
    ...(chartsEnabled
      ? [
          { href: "/charts/overall", label: "تحلیل‌ها", description: "نمودارها و گزارش‌های تحلیلی" },
          { href: "/maps/accidents", label: "نقشه تصادفات", description: "مشاهده رخدادها روی نقشه" },
        ]
      : []),
  ];

  // Panel selector ("پنل‌ها"): one clear destination per persona, driven by the
  // panel registry so the navbar, the guards and the landing redirect agree.
  const panelItems: NavItem[] = useMemo(
    () =>
      isAuthenticated
        ? getAccessiblePanels(viewer).map((panel) => ({
            href: panel.path,
            label: panel.label,
            description: panel.description,
          }))
        : [],
    // `viewer` is rebuilt each render; depend on the values it is derived from.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAuthenticated, userLevel, userData?.roles, hasModule, orgHasModule],
  );

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
    <header className="fixed inset-x-0 top-0 z-[9999] border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" dir="rtl">
        <div className="flex min-w-0 items-center gap-7">
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="مرصاد، صفحه اصلی">
            <Image src="/logo.png" alt="مرصاد" width={38} height={38} className="object-contain transition-transform group-hover:scale-105" />
            <span className="hidden text-sm font-bold text-fg sm:block">مرصاد</span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {publicItems.map((item) => <Link key={item.href} href={item.href} className={`rounded-xl px-3 py-2 text-sm transition ${pathname === item.href ? "bg-brand/15 text-brand-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg"}`}>{item.label}</Link>)}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {panelItems.length > 0 && <div className="relative" ref={panelsRef}>
            <button onClick={() => setPanelsOpen((open) => !open)} className={`tint-blue flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${panelsOpen ? "border-tint-border bg-tint-soft text-tint-fg" : "border-line text-fg-muted hover:bg-surface-hover"}`} aria-expanded={panelsOpen}>
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.8)]" />
              پنل‌ها
              <Chevron open={panelsOpen} />
            </button>
            {panelsOpen && <PanelMenu items={panelItems} pathname={pathname} onNavigate={() => setPanelsOpen(false)} />}
          </div>}
          {isAuthenticated ? <div className="relative" ref={profileRef}>
            <button onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg-muted transition hover:bg-surface-hover hover:text-fg" aria-expanded={profileOpen}>
              <span className="tint-blue flex h-8 w-8 items-center justify-center rounded-full border border-tint-border bg-tint-soft text-xs font-bold text-tint-fg">{displayName.slice(0, 1)}</span>
              <span className="max-w-28 truncate">{displayName}</span><Chevron open={profileOpen} />
            </button>
            {profileOpen && <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"><div className="border-b border-line bg-surface-sunken p-4"><p className="font-semibold text-fg">{displayName}</p><p className="mt-1 text-xs text-fg-faint">{roleLabels[userLevel || ""] || "حساب کاربری"}</p>{userData?.email && <p className="mt-2 truncate text-xs text-fg-muted" dir="ltr">{userData.email}</p>}</div><button onClick={logout} className="tint-rose w-full px-4 py-3 text-right text-sm text-tint-fg transition hover:bg-tint-soft">خروج از حساب</button></div>}
          </div> : <Link href="/login" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-on-brand shadow-[0_0_22px_rgba(37,99,235,.25)] transition hover:bg-brand-hover">ورود به سامانه</Link>}
        </div>

        <button onClick={() => setMenuOpen((open) => !open)} className="rounded-xl border border-line p-2 text-fg-muted md:hidden" aria-label={menuOpen ? "بستن منو" : "باز کردن منو"}>
          <span className="block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" /><span className="mt-1.5 block h-0.5 w-5 bg-current" />
        </button>
      </div>
      {menuOpen && <div className="border-t border-line bg-surface px-4 py-4 md:hidden" dir="rtl"><div className="space-y-1">{publicItems.map((item) => <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-3 text-sm text-fg-muted hover:bg-surface-hover">{item.label}</Link>)}</div>{panelItems.length > 0 && <div className="mt-3 border-t border-line pt-3"><p className="px-3 pb-2 text-xs text-fg-faint">پنل‌های در دسترس</p><PanelMenu items={panelItems} pathname={pathname} onNavigate={() => setMenuOpen(false)} mobile /> </div>}{isAuthenticated && <button onClick={logout} className="tint-rose mt-3 w-full rounded-xl border border-tint-border px-3 py-3 text-right text-sm text-tint-fg">خروج از حساب</button>}</div>}
    </header>
  );
};

function PanelMenu({ items, pathname, onNavigate, mobile = false }: { items: NavItem[]; pathname: string; onNavigate: () => void; mobile?: boolean }) {
  return <div className={mobile ? "space-y-1" : "absolute left-0 mt-2 w-72 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-2xl"}>{items.map((item) => <Link key={item.href} href={item.href} onClick={onNavigate} className={`block rounded-xl px-3 py-3 transition ${pathname.startsWith(item.href.split("/").slice(0, 2).join("/")) ? "bg-brand/10 text-brand-fg" : "text-fg-muted hover:bg-surface-hover hover:text-fg"}`}><span className="block text-sm font-medium">{item.label}</span>{item.description && <span className="mt-1 block text-xs text-fg-faint">{item.description}</span>}</Link>)}</div>;
}

function Chevron({ open }: { open: boolean }) { return <svg className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m6 9 6 6 6-6" /></svg>; }
