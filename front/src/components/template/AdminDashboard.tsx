"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { adminNavGroups } from "@/components/organisms/adminSidebarConfig";
import SeedDatabaseModal from "@/components/template/SeedDatabaseModal";

interface AdminDashboardData {
  users?: number;
  provinces?: number;
  cities?: number;
  accidents?: number;
  airStatuses?: number;
  areaUsages?: number;
  bodyInsuranceCos?: number;
  collisionTypes?: number;
  colors?: number;
  equipmentDamages?: number;
  faultStatuses?: number;
  humanReasons?: number;
  insuranceCos?: number;
  licenceTypes?: number;
  lightStatuses?: number;
  maxDamageSections?: number;
  motionDirections?: number;
  plaqueTypes?: number;
  plaqueUsages?: number;
  positions?: number;
  roads?: number;
  roadDefects?: number;
  roadRepairTypes?: number;
  roadSituations?: number;
  roadSurfaceConditions?: number;
  rulingTypes?: number;
  shoulderStatuses?: number;
  systems?: number;
  systemTypes?: number;
  types?: number;
  vehicleReasons?: number;
}

interface AdminDashboardProps {
  data: AdminDashboardData;
  token?: string;
}

const countLabels: Array<{ key: keyof AdminDashboardData; label: string; caption: string; tone: string }> = [
  { key: "users", label: "کاربران", caption: "حساب‌های سامانه", tone: "from-blue-500 to-cyan-400" },
  { key: "accidents", label: "تصادفات", caption: "گزارش‌های ثبت‌شده", tone: "from-rose-500 to-orange-400" },
  { key: "roads", label: "جاده‌ها", caption: "مسیرهای تعریف‌شده", tone: "from-emerald-500 to-teal-400" },
  { key: "cities", label: "شهرها", caption: "محدوده‌های جغرافیایی", tone: "from-violet-500 to-blue-400" },
];

const groupDescriptions: Record<string, string> = {
  "accidents-events": "ثبت و مدیریت رخدادهای ترافیکی",
  geography: "ساختار مکانی و شبکه راه‌ها",
  "accident-conditions": "مقادیر مرجع برای تحلیل تصادف",
  vehicles: "اطلاعات پایه وسایل نقلیه",
  insurance: "شرکت‌ها و پوشش‌های بیمه",
  drivers: "تنظیمات مرتبط با رانندگان",
  "accident-causes": "علل انسانی و فنی رخدادها",
};

export default function AdminDashboard({ data, token }: AdminDashboardProps) {
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = useMemo(
    () => adminNavGroups.map((group) => ({ ...group, items: group.items.filter((item) => !normalizedQuery || item.label.toLowerCase().includes(normalizedQuery)) })).filter((group) => group.items.length > 0),
    [normalizedQuery],
  );

  return (
    <div className="mx-auto max-w-[1500px] pb-10" dir="rtl">
      <section className="relative overflow-hidden rounded-3xl border border-line [background-image:var(--hero-gradient)] p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><span className="inline-flex rounded-full border border-tint-border bg-tint-soft px-3 py-1 text-xs text-tint-fg tint-cyan">مرکز کنترل سامانه</span><h1 className="mt-4 text-3xl font-bold text-fg sm:text-4xl">داشبورد مدیریت</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-fg-muted">وضعیت داده‌های اصلی را ببینید و از همین‌جا به پرکاربردترین بخش‌های سامانه دسترسی پیدا کنید.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/users/createUser" className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-on-brand shadow-[0_0_25px_rgba(37,99,235,.25)] transition hover:bg-brand-hover">+ ایجاد کاربر</Link><Link href="/admin/accident/create" className="rounded-xl border border-line-strong bg-surface-hover px-4 py-3 text-sm font-semibold text-fg transition hover:bg-surface-hover">ثبت تصادف</Link><button onClick={() => setIsSeedModalOpen(true)} className="tint-warning rounded-xl border border-tint-border bg-tint-soft px-4 py-3 text-sm font-semibold text-tint-fg transition hover:bg-tint-strong">بذرگذاری داده</button></div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {countLabels.map((item) => <div key={item.key} className="relative overflow-hidden rounded-2xl border border-line bg-surface/80 p-4 shadow-xl"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${item.tone}`} /><p className="text-sm text-fg-muted">{item.label}</p><p className="mt-2 text-2xl font-bold text-fg sm:text-3xl">{Number(data?.[item.key] || 0).toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-fg-faint">{item.caption}</p></div>)}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
        <section className="rounded-2xl border border-line bg-surface/75 p-5 shadow-xl sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-fg">دسترسی سریع</h2><p className="mt-1 text-xs text-fg-faint">بخش‌های پرکاربرد برای مدیریت روزانه</p></div><div className="relative w-full sm:w-64"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی بخش‌ها..." className="w-full rounded-xl border border-line bg-surface-sunken px-3 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-blue-400/50" /></div></div><div className="mt-5 space-y-4">{filteredGroups.map((group) => <ResourceGroup key={group.id} title={group.title} description={groupDescriptions[group.id]} items={group.items} />)}{filteredGroups.length === 0 && <div className="rounded-xl border border-dashed border-line-strong p-10 text-center text-sm text-fg-faint">بخشی با این عنوان پیدا نشد.</div>}</div></section>
        <aside className="space-y-5"><section className="tint-brand rounded-2xl border border-tint-border bg-tint-soft p-5 shadow-xl"><div className="flex items-center justify-between"><div><p className="text-xs text-tint-fg">عملیات مدیریتی</p><h2 className="mt-1 text-lg font-bold text-fg">گزارش‌های گشت</h2></div><span className="rounded-full border border-tint-border bg-tint-strong px-2.5 py-1 text-xs text-tint-fg">جدید</span></div><p className="mt-3 text-sm leading-6 text-fg-muted">صف بررسی گزارش‌های مأموران را باز کنید و وضعیت ثبت و بررسی را مدیریت کنید.</p><Link href="/patrol-manager/dashboard" className="mt-4 block rounded-xl bg-brand px-4 py-3 text-center text-sm font-semibold text-on-brand transition hover:bg-brand-hover">رفتن به مرکز بررسی</Link></section><section className="rounded-2xl border border-line bg-surface/75 p-5 shadow-xl"><p className="text-xs text-fg-faint">راهنمای استفاده</p><h2 className="mt-1 text-lg font-bold text-fg">از کجا شروع کنم؟</h2><div className="mt-4 space-y-3 text-sm text-fg-muted"><GuideStep number="۱" text="برای مدیریت دسترسی‌ها، بخش کاربران را باز کنید." /><GuideStep number="۲" text="برای تغییر داده‌های پایه از گروه‌های دسترسی سریع استفاده کنید." /><GuideStep number="۳" text="برای بررسی گزارش‌های مأموران، مرکز بررسی گشت را انتخاب کنید." /></div></section></aside>
      </div>
      <SeedDatabaseModal isOpen={isSeedModalOpen} onClose={() => setIsSeedModalOpen(false)} token={token} />
    </div>
  );
}

function ResourceGroup({ title, description, items }: { title: string; description?: string; items: Array<{ key: string; label: string; href: string }> }) {
  return <div className="rounded-2xl border border-line bg-surface-sunken p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-fg">{title}</h3>{description && <p className="mt-1 text-xs text-fg-faint">{description}</p>}</div><span className="rounded-full bg-surface-hover px-2 py-1 text-xs text-fg-faint">{items.length.toLocaleString("fa-IR")} بخش</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Link key={item.key} href={item.href} className="tint-brand group flex items-center justify-between rounded-xl border border-line bg-canvas/40 px-3 py-3 text-sm text-fg-muted transition hover:border-line-focus hover:bg-tint-soft hover:text-fg"><span>{item.label}</span><span className="text-fg-faint transition group-hover:text-tint-fg">←</span></Link>)}</div></div>;
}

function GuideStep({ number, text }: { number: string; text: string }) { return <div className="flex items-start gap-3"><span className="tint-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tint-strong text-xs font-semibold text-tint-fg">{number}</span><span className="leading-6">{text}</span></div>; }
