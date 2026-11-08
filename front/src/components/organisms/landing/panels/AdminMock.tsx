import React from "react";
import { MockFrame, MockSwitch, StatusPill } from "./MockFrame";

const MODULES = [
  { label: "تحلیل داده و نمودارها", on: true },
  { label: "گشت و ثبت گزارش", on: true },
  { label: "فرم‌ساز سازمانی", on: true },
  { label: "انبار و موجودی", on: false },
];

const USERS = [
  { initials: "م.ر", name: "مریم رستمی", role: "مدیر سامانه", tone: "info" as const },
  { initials: "ع.ک", name: "علی کریمی", role: "سرپرست سازمان", tone: "success" as const },
  { initials: "ح.ن", name: "حسین نجفی", role: "افسر گشت", tone: "warning" as const },
];

/** A still frame of `/admin`: module licensing per organization, plus the user list. */
export function AdminMock() {
  return (
    <MockFrame title="پنل مدیریت سامانه" badge="Ghost">
      <div className="space-y-3">
        <section className="rounded-xl border border-line bg-surface p-3">
          <header className="mb-2.5 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold text-fg">مجوز ماژول‌ها</h4>
            <StatusPill tone="info">راهداری خراسان رضوی</StatusPill>
          </header>
          <ul className="space-y-2.5">
            {MODULES.map((module) => (
              <li key={module.label} className="flex items-center gap-2">
                <span className="min-w-0 truncate text-[11px] text-fg-muted">{module.label}</span>
                <span className="ms-auto" />
                <MockSwitch on={module.on} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-surface p-3">
          <header className="mb-2.5 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold text-fg">کاربران و نقش‌ها</h4>
            <span className="text-[10px] text-fg-faint">۱٬۲۴۸ کاربر</span>
          </header>
          <ul className="space-y-2">
            {USERS.map((user) => (
              <li key={user.name} className="flex items-center gap-2">
                <span className="tint-slate flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-tint-border bg-tint-soft text-[9px] font-bold text-tint-fg">
                  {user.initials}
                </span>
                <span className="min-w-0 truncate text-[11px] text-fg">{user.name}</span>
                <StatusPill tone={user.tone} className="ms-auto">
                  {user.role}
                </StatusPill>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </MockFrame>
  );
}
