import { UNIT_TYPE_LABELS } from "@/utils/org";

export type OrgRoleName = "OrgHead" | "UnitHead" | "Officer";

export interface OrgRoleRow {
  name: OrgRoleName;
  scopeType?: "organization" | "unit";
  scopeId?: string;
}

export const ORG_ROLE_OPTIONS: Array<{ value: OrgRoleName; label: string }> = [
  { value: "OrgHead", label: "سرپرست سازمان" },
  { value: "UnitHead", label: "سرپرست واحد" },
  { value: "Officer", label: "مامور" },
];

export const ORG_ROLE_LABELS: Record<OrgRoleName, string> = {
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Officer: "مامور",
};

export const ORG_ROLE_TONES: Record<string, string> = {
  OrgHead: "tint-violet border-tint-border bg-tint-soft text-tint-fg",
  UnitHead: "tint-blue border-tint-border bg-tint-soft text-tint-fg",
  Officer: "tint-cyan border-tint-border bg-tint-soft text-tint-fg",
};

export const MEMBER_LEVEL_OPTIONS = [
  { value: "OrgHead", label: "سرپرست سازمان" },
  { value: "UnitHead", label: "سرپرست واحد" },
  { value: "Patrol", label: "مامور گشت" },
];

export const MANAGER_LEVEL_OPTIONS = [
  { value: "Manager", label: "مدیر" },
  ...MEMBER_LEVEL_OPTIONS,
  { value: "Editor", label: "ویرایشگر" },
  { value: "Enterprise", label: "سازمانی" },
];

export { UNIT_TYPE_LABELS };

export function scopeLabel(role: OrgRoleRow, units: Record<string, string>, orgId?: string): string {
  if (role.scopeType === "organization") return orgId && role.scopeId === orgId ? "این سازمان" : role.scopeId || "";
  if (role.scopeType === "unit") return units[role.scopeId || ""] || role.scopeId || "";
  return "";
}
