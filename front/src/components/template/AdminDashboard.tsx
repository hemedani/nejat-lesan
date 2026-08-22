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
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-l from-blue-950/90 via-slate-900 to-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div><span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">مرکز کنترل سامانه</span><h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">داشبورد مدیریت</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">وضعیت داده‌های اصلی را ببینید و از همین‌جا به پرکاربردترین بخش‌های سامانه دسترسی پیدا کنید.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/admin/users/createUser" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(37,99,235,.25)] transition hover:bg-blue-500">+ ایجاد کاربر</Link><Link href="/admin/accident/create" className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">ثبت تصادف</Link><button onClick={() => setIsSeedModalOpen(true)} className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100 transition hover:bg-amber-300/20">بذرگذاری داده</button></div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {countLabels.map((item) => <div key={item.key} className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-l ${item.tone}`} /><p className="text-sm text-slate-400">{item.label}</p><p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{Number(data?.[item.key] || 0).toLocaleString("fa-IR")}</p><p className="mt-1 text-xs text-slate-500">{item.caption}</p></div>)}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.75fr)]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-white">دسترسی سریع</h2><p className="mt-1 text-xs text-slate-500">بخش‌های پرکاربرد برای مدیریت روزانه</p></div><div className="relative w-full sm:w-64"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجوی بخش‌ها..." className="w-full rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-400/50" /></div></div><div className="mt-5 space-y-4">{filteredGroups.map((group) => <ResourceGroup key={group.id} title={group.title} description={groupDescriptions[group.id]} items={group.items} />)}{filteredGroups.length === 0 && <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-500">بخشی با این عنوان پیدا نشد.</div>}</div></section>
        <aside className="space-y-5"><section className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5 shadow-xl"><div className="flex items-center justify-between"><div><p className="text-xs text-blue-200">عملیات مدیریتی</p><h2 className="mt-1 text-lg font-bold text-white">گزارش‌های گشت</h2></div><span className="rounded-full border border-blue-300/20 bg-blue-300/10 px-2.5 py-1 text-xs text-blue-200">جدید</span></div><p className="mt-3 text-sm leading-6 text-slate-300">صف بررسی گزارش‌های مأموران را باز کنید و وضعیت ثبت و بررسی را مدیریت کنید.</p><Link href="/patrol-manager/dashboard" className="mt-4 block rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-500">رفتن به مرکز بررسی</Link></section><section className="rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-xl"><p className="text-xs text-slate-500">راهنمای استفاده</p><h2 className="mt-1 text-lg font-bold text-white">از کجا شروع کنم؟</h2><div className="mt-4 space-y-3 text-sm text-slate-300"><GuideStep number="۱" text="برای مدیریت دسترسی‌ها، بخش کاربران را باز کنید." /><GuideStep number="۲" text="برای تغییر داده‌های پایه از گروه‌های دسترسی سریع استفاده کنید." /><GuideStep number="۳" text="برای بررسی گزارش‌های مأموران، مرکز بررسی گشت را انتخاب کنید." /></div></section></aside>
      </div>
      <SeedDatabaseModal isOpen={isSeedModalOpen} onClose={() => setIsSeedModalOpen(false)} token={token} />
    </div>
  );
}

function ResourceGroup({ title, description, items }: { title: string; description?: string; items: Array<{ key: string; label: string; href: string }> }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-100">{title}</h3>{description && <p className="mt-1 text-xs text-slate-500">{description}</p>}</div><span className="rounded-full bg-white/[.06] px-2 py-1 text-xs text-slate-500">{items.length.toLocaleString("fa-IR")} بخش</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <Link key={item.key} href={item.href} className="group flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 px-3 py-3 text-sm text-slate-300 transition hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-100"><span>{item.label}</span><span className="text-slate-600 transition group-hover:text-blue-300">←</span></Link>)}</div></div>;
}

function GuideStep({ number, text }: { number: string; text: string }) { return <div className="flex items-start gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs text-blue-200">{number}</span><span className="leading-6">{text}</span></div>; }
