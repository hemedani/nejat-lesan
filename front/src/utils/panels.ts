import type { ModuleKey, RoleName, UserLevel, UserRole } from "@/types/auth";
import type { PanelIconName } from "@/components/system/panel-icons";

/**
 * Role panels
 * -----------
 * LESEN has four distinct working surfaces. Before this module the frontend had
 * one shared `/org` workspace for both OrgHead and UnitHead (identical sidebar)
 * and no Employee surface at all. This registry is the single source of truth
 * for who may open which panel and where a user lands after login.
 *
 * Levels come from `user.level` (the coarse auth gate); `roles[]` carries the
 * org/unit scoping. Both are consulted because the backend keeps them
 * independent (a `UnitHead` role can sit on a user whose level is `Editor`).
 */

export type PanelId =
  | "admin"
  | "orghead"
  | "unit-head"
  | "employee"
  | "patrol"
  | "patrol-manager"
  | "profile";

/** Panels rendered through the shared `PanelShell` chrome. */
export type ShellPanelId = Exclude<PanelId, "admin">;

export interface PanelViewer {
  level: UserLevel;
  roles?: UserRole[];
  /** Install-level module gate. */
  hasModule: (key: ModuleKey) => boolean;
  /** Organization-scoped module gate. */
  orgHasModule: (key: ModuleKey) => boolean;
}

export interface PanelDef {
  id: PanelId;
  path: string;
  label: string;
  description: string;
  icon: PanelIconName;
  /** Levels that grant the panel outright. */
  levels?: UserLevel[];
  /** Org/unit role names that grant the panel. */
  roleNames?: RoleName[];
  /** Levels that additionally grant the panel (org leaders reach the employee surface). */
  extraLevels?: UserLevel[];
  /** Whole-panel module requirement (install level). */
  requiredModule?: ModuleKey;
  /** Sort order for the panel switcher — lower comes first. */
  order: number;
}

export const PANEL_DEFINITIONS: PanelDef[] = [
  {
    id: "admin",
    path: "/admin",
    label: "پنل مدیریت سامانه",
    description: "سازمان‌ها، کاربران، ماژول‌ها و داده‌های پایه",
    icon: "shield",
    levels: ["Ghost", "Manager", "Editor"],
    order: 10,
  },
  {
    id: "orghead",
    path: "/orghead",
    label: "داشبورد سرپرست سازمان",
    description: "نمودار سازمان، واحدها، افراد، فرایندها، رخدادها و انبار سازمان",
    icon: "building",
    levels: ["OrgHead"],
    roleNames: ["OrgHead"],
    order: 20,
  },
  {
    id: "unit-head",
    path: "/unit-head",
    label: "داشبورد سرپرست واحد",
    description: "اعضای واحد، رخدادهای واحد و انبار واحد تحت سرپرستی",
    icon: "units",
    levels: ["UnitHead"],
    roleNames: ["UnitHead"],
    order: 30,
  },
  {
    id: "employee",
    path: "/employee",
    label: "پنل کارمند",
    description: "دسترسی به انبار واحد و ثبت و پیگیری رخدادها",
    icon: "user",
    levels: ["Enterprise", "Patrol"],
    roleNames: ["Officer"],
    extraLevels: ["OrgHead", "UnitHead"],
    order: 40,
  },
  {
    id: "patrol",
    path: "/patrol/dashboard",
    label: "داشبورد مأمور گشت",
    description: "شیفت، ثبت رخداد و گزارش‌های من",
    icon: "road",
    levels: ["Patrol"],
    requiredModule: "incident_patrol",
    order: 50,
  },
  {
    id: "patrol-manager",
    path: "/patrol-manager/dashboard",
    label: "مرکز بررسی گشت",
    description: "صف بررسی گزارش‌های مأموران گشت",
    icon: "reports",
    levels: ["Ghost", "Manager"],
    requiredModule: "incident_patrol",
    order: 60,
  },
  {
    id: "profile",
    path: "/user",
    label: "پنل کاربری",
    description: "اطلاعات حساب و تنظیمات شخصی",
    icon: "user",
    order: 90,
  },
];

/** Levels that reach every panel (subject to module gating). */
const SUPER_LEVELS: UserLevel[] = ["Ghost", "Manager"];

/** Levels that manage organizations — they may open any org's panels. */
const ORG_MANAGER_LEVELS: UserLevel[] = ["Ghost", "Manager"];

export function getRoleNames(roles?: UserRole[]): RoleName[] {
  return (roles || []).map((role) => role.name);
}

export function isSuperViewer(viewer: PanelViewer): boolean {
  return SUPER_LEVELS.includes(viewer.level);
}

export function isOrgManager(viewer: PanelViewer): boolean {
  return ORG_MANAGER_LEVELS.includes(viewer.level);
}

/** Org/unit-scoped roles the viewer actually holds (scopeType + scopeId present). */
export function getScopedRoles(roles?: UserRole[]): UserRole[] {
  return (roles || []).filter((role) => Boolean(role.scopeType && role.scopeId));
}

export function isOrgHeadViewer(viewer: PanelViewer): boolean {
  return (
    viewer.level === "OrgHead" ||
    (viewer.roles || []).some((role) => role.name === "OrgHead")
  );
}

export function isUnitHeadViewer(viewer: PanelViewer): boolean {
  return (
    viewer.level === "UnitHead" ||
    (viewer.roles || []).some((role) => role.name === "UnitHead")
  );
}

export function canAccessPanel(viewer: PanelViewer, panel: PanelDef): boolean {
  if (panel.requiredModule && !viewer.hasModule(panel.requiredModule)) return false;

  if (isSuperViewer(viewer)) return true;

  if (panel.id === "profile") return true;

  const roleNames = getRoleNames(viewer.roles);

  if (panel.levels?.includes(viewer.level)) return true;
  if (panel.extraLevels?.includes(viewer.level)) return true;
  if (panel.roleNames?.some((name) => roleNames.includes(name))) return true;

  return false;
}

export function getAccessiblePanels(viewer: PanelViewer): PanelDef[] {
  return PANEL_DEFINITIONS.filter((panel) => canAccessPanel(viewer, panel)).sort(
    (a, b) => a.order - b.order,
  );
}

export function getPanelById(id: PanelId): PanelDef | undefined {
  return PANEL_DEFINITIONS.find((panel) => panel.id === id);
}

/**
 * Where a viewer lands after login.
 *
 * Org/unit membership outranks the coarse `level` because a scoped role is the
 * specific signal that the person actually works inside an organization — an
 * `Editor`-level user placed in a unit belongs in the employee panel, and can
 * still open `/admin` from the panel switcher.
 */
export function getDefaultPanel(viewer: PanelViewer): string {
  if (isSuperViewer(viewer)) return "/admin";

  if (isOrgHeadViewer(viewer)) return "/orghead";
  if (isUnitHeadViewer(viewer)) return "/unit-head";

  if (getScopedRoles(viewer.roles).length > 0) return "/employee";

  if (viewer.level === "Editor") return "/admin";

  if (viewer.level === "Patrol") {
    return viewer.hasModule("incident_patrol") ? "/patrol/dashboard" : "/user";
  }

  if (viewer.level === "Enterprise") {
    return viewer.hasModule("charts") ? "/charts/overall" : "/employee";
  }

  return "/user";
}

/** Highest role held, used for the header chip. */
const ROLE_HIERARCHY: RoleName[] = [
  "Ghost",
  "Manager",
  "OrgHead",
  "UnitHead",
  "Officer",
  "Editor",
  "Enterprise",
  "Patrol",
];

export function getHighestRole(roles?: UserRole[]): UserRole | undefined {
  if (!roles?.length) return undefined;
  for (const name of ROLE_HIERARCHY) {
    const found = roles.find((role) => role.name === name);
    if (found) return found;
  }
  return roles[0];
}

/**
 * Builds a `PanelViewer` from raw session data (login payload or stored user).
 *
 * Module semantics mirror `AuthContext`: Ghost is exempt, and an unknown module
 * list degrades to "enabled" so a missing feed never hides a panel the backend
 * would actually allow.
 */
export function makePanelViewer(input: {
  level: UserLevel;
  roles?: UserRole[];
  modules?: string[];
  orgModules?: string[];
}): PanelViewer {
  const isGhost = input.level === "Ghost";
  const modulesKnown = Array.isArray(input.modules);
  const orgModules = input.orgModules;
  const orgKnown = Array.isArray(orgModules) && orgModules.length > 0;
  const effectiveOrg = orgKnown ? orgModules : input.modules;
  const effectiveOrgKnown = orgKnown || modulesKnown;

  return {
    level: input.level,
    roles: input.roles,
    hasModule: (key) => isGhost || !modulesKnown || (input.modules as string[]).includes(key),
    orgHasModule: (key) =>
      isGhost || !effectiveOrgKnown || (effectiveOrg ?? []).includes(key),
  };
}

/** Human-readable label for a level, used in panel headers. */
export const LEVEL_LABELS: Record<Exclude<UserLevel, null>, string> = {
  Ghost: "دسترسی کامل",
  Manager: "مدیر سامانه",
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Editor: "ویرایشگر داده",
  Enterprise: "کاربر سازمانی",
  Patrol: "مأمور گشت",
};
