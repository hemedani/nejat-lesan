"use client";

import { useAuth } from "@/context/AuthContext";
import type { ModuleKey } from "@/types/auth";

const MODULE_NOTICES: Partial<Record<ModuleKey, string>> = {
  charts: "ماژول تحلیل و نمودار تصادفات برای این نصب/سازمان فعال نیست.",
  incident_patrol: "ماژول ثبت و مدیریت رخداد (گشت) برای این نصب/سازمان فعال نیست.",
  warehouse: "ماژول مدیریت انبار برای این نصب/سازمان فعال نیست.",
};

export function ModuleGate({
  module,
  scoped = false,
  enabled,
  message,
  children,
}: {
  module: ModuleKey;
  scoped?: boolean;
  enabled?: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  const { hasModule, orgHasModule } = useAuth();
  const effectiveEnabled = enabled !== undefined ? enabled : scoped ? orgHasModule(module) : hasModule(module);

  if (effectiveEnabled) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-amber-400/20 bg-amber-400/10 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10">
          <svg className="h-6 w-6 text-amber-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM3.75 19.5 12 4.5l8.25 15H3.75Z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-amber-100">این بخش فعال نیست</h2>
        <p className="mt-3 text-sm leading-6 text-amber-200/80">
          {message || MODULE_NOTICES[module] || "این ماژول برای این نصب/سازمان فعال نیست."}
        </p>
      </div>
    </div>
  );
}
