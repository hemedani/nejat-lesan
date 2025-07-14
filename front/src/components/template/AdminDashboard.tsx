"use client";

import { useState } from "react";
import { StatCard } from "@/components/organisms/InfoBox";
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data, token }) => {
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-start">
        <div className="bg-blue-500 w-1 h-8 ml-3 rounded-full"></div>
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            پنل ادمین
          </h1>
          <p className="text-gray-500 mt-2 text-sm">خوش آمدید</p>
        </div>
      </div>

      <div className="mt-6 flex justify-start">
        <button
          onClick={() => setIsSeedModalOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          بذرگذاری پایگاه داده
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-10 gap-4">
        <StatCard
          description="تعداد کاربران سایت"
          title="کاربران"
          value={data?.users || 0}
          bgColor="bg-blue-500"
        />
        <StatCard
          description="تعداد استان های سامانه"
          title="استان ها"
          value={data?.provinces || 0}
          bgColor="bg-red-500"
        />
        <StatCard
          description="تعداد شهرهای سامانه"
          title="شهرها"
          value={data?.cities || 0}
          bgColor="bg-fuchsia-500"
        />
        <StatCard
          description="تعداد کل تصادفات ثبت شده"
          title="تصادفات"
          value={data?.accidents || 0}
          bgColor="bg-green-500"
        />
        <StatCard
          description="تعداد انواع وضعیت جوی"
          title="وضعیت جوی"
          value={data?.airStatuses || 0}
          bgColor="bg-yellow-500"
        />
        <StatCard
          description="تعداد انواع کاربری منطقه"
          title="کاربری منطقه"
          value={data?.areaUsages || 0}
          bgColor="bg-indigo-500"
        />
        <StatCard
          description="تعداد شرکت‌های بیمه بدنه"
          title="شرکت‌های بیمه بدنه"
          value={data?.bodyInsuranceCos || 0}
          bgColor="bg-pink-500"
        />
        <StatCard
          description="تعداد انواع برخورد در تصادفات"
          title="انواع برخورد"
          value={data?.collisionTypes || 0}
          bgColor="bg-purple-500"
        />
        <StatCard
          description="تعداد رنگ‌های خودرو ثبت شده"
          title="رنگ‌ها"
          value={data?.colors || 0}
          bgColor="bg-sky-500"
        />
        <StatCard
          description="تعداد انواع خسارات تجهیزات"
          title="خسارات تجهیزات"
          value={data?.equipmentDamages || 0}
          bgColor="bg-teal-500"
        />
        <StatCard
          description="تعداد وضعیت‌های مقصر بودن"
          title="وضعیت مقصر"
          value={data?.faultStatuses || 0}
          bgColor="bg-orange-500"
        />
        <StatCard
          description="تعداد علل انسانی در تصادفات"
          title="علل انسانی تصادف"
          value={data?.humanReasons || 0}
          bgColor="bg-lime-500"
        />
        <StatCard
          description="تعداد شرکت‌های بیمه شخص ثالث"
          title="شرکت‌های بیمه (ثالث)"
          value={data?.insuranceCos || 0}
          bgColor="bg-emerald-500"
        />
        <StatCard
          description="تعداد انواع گواهینامه رانندگی"
          title="انواع گواهینامه"
          value={data?.licenceTypes || 0}
          bgColor="bg-cyan-500"
        />
        <StatCard
          description="تعداد وضعیت‌های روشنایی راه"
          title="وضعیت روشنایی"
          value={data?.lightStatuses || 0}
          bgColor="bg-rose-500"
        />
        <StatCard
          description="تعداد نواحی اصلی خسارت خودرو"
          title="محل اصلی خسارت"
          value={data?.maxDamageSections || 0}
          bgColor="bg-amber-500"
        />
        <StatCard
          description="تعداد جهت‌های حرکت وسایل نقلیه"
          title="جهت حرکت"
          value={data?.motionDirections || 0}
          bgColor="bg-slate-500"
        />
        <StatCard
          description="تعداد انواع پلاک انتظامی"
          title="انواع پلاک"
          value={data?.plaqueTypes || 0}
          bgColor="bg-stone-500"
        />
        <StatCard
          description="تعداد انواع کاربری پلاک"
          title="کاربری پلاک"
          value={data?.plaqueUsages || 0}
          bgColor="bg-gray-500"
        />
        <StatCard
          description="تعداد موقعیت‌ها/پست‌های سازمانی"
          title="موقعیت‌های سازمانی"
          value={data?.positions || 0}
          bgColor="bg-zinc-500"
        />
        <StatCard
          description="تعداد جاده‌های تعریف شده"
          title="جاده‌ها"
          value={data?.roads || 0}
          bgColor="bg-neutral-500"
        />
        <StatCard
          description="تعداد انواع نواقص راه"
          title="نواقص راه"
          value={data?.roadDefects || 0}
          bgColor="bg-red-400"
        />
        <StatCard
          description="تعداد انواع تعمیرات راه"
          title="انواع تعمیرات راه"
          value={data?.roadRepairTypes || 0}
          bgColor="bg-orange-400"
        />
        <StatCard
          description="تعداد انواع وضعیت راه"
          title="وضعیت راه"
          value={data?.roadSituations || 0}
          bgColor="bg-amber-400"
        />
        <StatCard
          description="تعداد انواع وضعیت سطح راه"
          title="وضعیت سطح راه"
          value={data?.roadSurfaceConditions || 0}
          bgColor="bg-yellow-400"
        />
        <StatCard
          description="تعداد انواع رای صادره"
          title="انواع رای"
          value={data?.rulingTypes || 0}
          bgColor="bg-lime-400"
        />
        <StatCard
          description="تعداد انواع وضعیت شانه راه"
          title="وضعیت شانه راه"
          value={data?.shoulderStatuses || 0}
          bgColor="bg-green-400"
        />
        <StatCard
          description="تعداد سیستم‌های مرتبط"
          title="سیستم‌ها"
          value={data?.systems || 0}
          bgColor="bg-emerald-400"
        />
        <StatCard
          description="تعداد انواع سیستم‌ها"
          title="انواع سیستم"
          value={data?.systemTypes || 0}
          bgColor="bg-teal-400"
        />
        <StatCard
          description="تعداد انواع عمومی ثبت شده"
          title="انواع (کلی)"
          value={data?.types || 0}
          bgColor="bg-cyan-400"
        />
        <StatCard
          description="تعداد علل مرتبط با وسیله نقلیه"
          title="علل وسیله نقلیه"
          value={data?.vehicleReasons || 0}
          bgColor="bg-sky-400"
        />
      </div>

      <SeedDatabaseModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        token={token}
      />
    </>
  );
};

export default AdminDashboard;
