import type { ModuleKey, RoleName, UserLevel } from "@/types/auth";
import type { PanelIconName } from "@/components/system/panel-icons";
import { getRoleNames, isSuperViewer, type PanelViewer, type ShellPanelId } from "@/utils/panels";

/**
 * Sidebar layout per panel.
 *
 * Each item declares the gate that must hold for it to render, so a UnitHead
 * never sees org-wide management entries and an Employee only sees the
 * warehouse/patrol surface they actually have. Module-gated entries disappear
 * when the organization has the module switched off (Ghost stays exempt, which
 * `orgHasModule` already encodes).
 */

export interface PanelNavItem {
  href: string;
  label: string;
  icon: PanelIconName;
  /** Only render when the viewer holds one of these org/unit roles. */
  allowedRoles?: RoleName[];
  /** Only render when the viewer's level is one of these. */
  allowedLevels?: UserLevel[];
  /** Only render when the module is on for the viewer's organization. */
  requiredModule?: ModuleKey;
}

export interface PanelNavSection {
  label: string;
  items: PanelNavItem[];
  /** Hides the whole section unless the module is on. */
  requiredModule?: ModuleKey;
  /** Hides the whole section unless the viewer's level is one of these. */
  allowedLevels?: UserLevel[];
}

export interface PanelNav {
  storageKey: string;
  brand: { label: string; description: string; icon: PanelIconName };
  sections: PanelNavSection[];
}

const ORGHEAD_NAV: PanelNav = {
  storageKey: "orghead",
  brand: {
    label: "مدیریت سازمان",
    description: "پنل سرپرست سازمان",
    icon: "building",
  },
  sections: [
    {
      label: "داشبورد",
      items: [{ href: "/orghead", label: "نمای کلی سازمان", icon: "dashboard" }],
    },
    {
      label: "ساختار سازمانی",
      items: [
        { href: "/orghead/org-chart", label: "نمودار سازمانی", icon: "network" },
        { href: "/orghead/units", label: "واحدها", icon: "units" },
        { href: "/orghead/people", label: "افراد و نقش‌ها", icon: "users" },
      ],
    },
    {
      label: "رخدادها",
      requiredModule: "incident_patrol",
      items: [
        { href: "/orghead/processes", label: "فرایندهای ثبت رخداد", icon: "workflow" },
        { href: "/orghead/reports", label: "گزارش‌های رخداد", icon: "reports" },
      ],
    },
    {
      label: "انبار و موجودی",
      requiredModule: "warehouse",
      items: [
        { href: "/orghead/warehouse", label: "موجودی و گردش کالا", icon: "warehouse" },
      ],
    },
    {
      label: "تنظیمات",
      items: [{ href: "/orghead/settings", label: "تنظیمات سازمان", icon: "settings" }],
    },
  ],
};

const UNIT_HEAD_NAV: PanelNav = {
  storageKey: "unit-head",
  brand: {
    label: "مدیریت واحد",
    description: "پنل سرپرست واحد",
    icon: "units",
  },
  sections: [
    {
      label: "داشبورد",
      items: [{ href: "/unit-head", label: "نمای کلی واحد", icon: "dashboard" }],
    },
    {
      label: "واحد من",
      items: [
        { href: "/unit-head/members", label: "اعضای واحد", icon: "users" },
        { href: "/unit-head/org-chart", label: "جایگاه در سازمان", icon: "network" },
      ],
    },
    {
      label: "رخدادها",
      requiredModule: "incident_patrol",
      items: [
        { href: "/unit-head/reports", label: "رخدادهای واحد", icon: "reports" },
      ],
    },
    {
      label: "انبار و موجودی",
      requiredModule: "warehouse",
      items: [
        { href: "/unit-head/warehouse", label: "انبار واحد", icon: "warehouse" },
      ],
    },
  ],
};

const EMPLOYEE_NAV: PanelNav = {
  storageKey: "employee",
  brand: {
    label: "پنل کارمند",
    description: "انبار و رخدادها",
    icon: "user",
  },
  sections: [
    {
      label: "داشبورد",
      items: [{ href: "/employee", label: "صفحه من", icon: "dashboard" }],
    },
    {
      label: "انبار",
      requiredModule: "warehouse",
      items: [
        { href: "/employee/warehouse", label: "انبار واحد من", icon: "warehouse" },
      ],
    },
    {
      label: "گشت و رخدادها",
      requiredModule: "incident_patrol",
      // The patrol report surface is level-gated on the backend
      // (`getReportScope` accepts Patrol/Manager/Ghost only), so only officers
      // see this section — an Officer/Enterprise employee gets warehouse access.
      allowedLevels: ["Patrol"],
      items: [
        { href: "/employee/reports", label: "رخدادهای من", icon: "reports" },
        { href: "/employee/map", label: "نقشه حوادث", icon: "map" },
        { href: "/employee/announcements", label: "اطلاعیه‌ها", icon: "bell" },
      ],
    },
  ],
};

const PATROL_NAV: PanelNav = {
  storageKey: "patrol",
  brand: {
    label: "پنل مأمور گشت",
    description: "ثبت و پیگیری رخداد",
    icon: "road",
  },
  sections: [
    {
      label: "گشت",
      items: [
        { href: "/patrol/dashboard", label: "داشبورد من", icon: "dashboard" },
        { href: "/patrol/reports", label: "گزارش‌های من", icon: "reports" },
      ],
    },
  ],
};

const PATROL_MANAGER_NAV: PanelNav = {
  storageKey: "patrol-manager",
  brand: {
    label: "مرکز بررسی گشت",
    description: "صف بررسی گزارش‌ها",
    icon: "reports",
  },
  sections: [
    {
      label: "بررسی",
      items: [
        { href: "/patrol-manager/dashboard", label: "نمای کلی", icon: "dashboard" },
        { href: "/patrol-manager/reports", label: "صف گزارش‌ها", icon: "clipboard" },
      ],
    },
  ],
};

const PROFILE_NAV: PanelNav = {
  storageKey: "profile",
  brand: {
    label: "پنل کاربری",
    description: "اطلاعات حساب",
    icon: "user",
  },
  sections: [],
};

export const PANEL_NAV: Record<ShellPanelId, PanelNav> = {
  orghead: ORGHEAD_NAV,
  "unit-head": UNIT_HEAD_NAV,
  employee: EMPLOYEE_NAV,
  patrol: PATROL_NAV,
  "patrol-manager": PATROL_MANAGER_NAV,
  profile: PROFILE_NAV,
};

function itemVisible(item: PanelNavItem, viewer: PanelViewer): boolean {
  if (item.requiredModule && !viewer.orgHasModule(item.requiredModule)) return false;

  if (isSuperViewer(viewer)) return true;

  if (item.allowedLevels?.length && !item.allowedLevels.includes(viewer.level)) {
    return false;
  }
  if (item.allowedRoles?.length) {
    const roleNames = getRoleNames(viewer.roles);
    if (!item.allowedRoles.some((name) => roleNames.includes(name))) return false;
  }
  return true;
}

export function filterPanelSections(
  sections: PanelNavSection[],
  viewer: PanelViewer,
): PanelNavSection[] {
  const superViewer = isSuperViewer(viewer);

  return sections
    .map((section) => {
      if (
        section.requiredModule &&
        !viewer.orgHasModule(section.requiredModule)
      ) {
        return null;
      }
      if (
        !superViewer &&
        section.allowedLevels?.length &&
        !section.allowedLevels.includes(viewer.level)
      ) {
        return null;
      }
      const items = section.items.filter((item) => itemVisible(item, viewer));
      return items.length > 0 ? { ...section, items } : null;
    })
    .filter((section): section is PanelNavSection => section !== null);
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}
