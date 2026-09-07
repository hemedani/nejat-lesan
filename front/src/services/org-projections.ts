import type { ReqType } from "@/types/declarations/selectInp";

type OrgGetsGet = ReqType["main"]["organization"]["gets"]["get"];
type OrgGetGet = ReqType["main"]["organization"]["get"]["get"];
type UnitGetsGet = ReqType["main"]["unit"]["gets"]["get"];
type UnitGetGet = ReqType["main"]["unit"]["get"]["get"];
type ProcessGetsGet = ReqType["main"]["accident_process"]["gets"]["get"];

export const organizationListItemProjection = {
  _id: 1,
  code: 1,
  name: 1,
  enName: 1,
  description: 1,
  is_active: 1,
  module_flags: 1,
  road: {
    _id: 1,
    name: 1,
    origin: 1,
    destination: 1,
  },
  head: {
    _id: 1,
    first_name: 1,
    last_name: 1,
    personnel_code: 1,
  },
} satisfies OrgGetsGet;

export const organizationDetailProjection = {
  ...organizationListItemProjection,
  createdAt: 1,
  updatedAt: 1,
  head: {
    _id: 1,
    first_name: 1,
    last_name: 1,
    personnel_code: 1,
    mobile: 1,
    email: 1,
  },
  registrer: {
    _id: 1,
    first_name: 1,
    last_name: 1,
  },
} satisfies OrgGetGet;

export const unitListItemProjection = {
  _id: 1,
  code: 1,
  name: 1,
  description: 1,
  is_active: 1,
  type: 1,
  address: 1,
  phone: 1,
  head_title: 1,
  organization: {
    _id: 1,
    code: 1,
    name: 1,
  },
  road: {
    _id: 1,
    name: 1,
  },
  parentUnit: {
    _id: 1,
    name: 1,
  },
  head: {
    _id: 1,
    first_name: 1,
    last_name: 1,
    personnel_code: 1,
  },
} satisfies UnitGetsGet;

export const unitDetailProjection = {
  ...unitListItemProjection,
  createdAt: 1,
  updatedAt: 1,
  officers: {
    _id: 1,
    first_name: 1,
    last_name: 1,
    personnel_code: 1,
    mobile: 1,
    email: 1,
    level: 1,
    roles: 1,
  },
  vehicles: {
    _id: 1,
    plaque_no: 1,
    title: 1,
    is_active: 1,
  },
} satisfies UnitGetGet;

export const accidentProcessListItemProjection = {
  _id: 1,
  name: 1,
  description: 1,
  status: 1,
  version: 1,
  is_active: 1,
  incident_type: 1,
  createdAt: 1,
  updatedAt: 1,
  organization: {
    _id: 1,
    code: 1,
    name: 1,
  },
} satisfies ProcessGetsGet;

export type OrganizationListItem = {
  _id: string;
  code: string;
  name: string;
  enName?: string;
  description?: string;
  is_active: boolean;
  module_flags?: { key: string; enabled: boolean }[];
  road?: {
    _id?: string;
    name: string;
    origin?: string;
    destination?: string;
  };
  head?: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    personnel_code?: string;
  };
};

export type UnitType = "Patrol" | "Station" | "Ops" | "Maintenance" | "Logistics" | "Administration" | "Warehouse" | "General";

export type UnitListItem = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  type: UnitType;
  address?: string;
  phone?: string;
  head_title?: string;
  organization?: { _id?: string; code?: string; name: string };
  road?: { _id?: string; name: string };
  parentUnit?: { _id?: string; name: string };
  head?: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    personnel_code?: string;
  };
};

export type OrgChartUnit = UnitListItem & {
  parentUnit?: { _id: string; name: string };
  head?: { _id: string; first_name: string; last_name: string };
};

export type OrgChartStats = { _id: UnitType; count: number }[];

export type OrgChartResponse = {
  units?: OrgChartUnit[];
  totalCount?: number;
  organization?: { _id: string; code: string; name: string; road?: { _id?: string; name: string } };
  stats?: OrgChartStats;
};

export type AccidentProcessListItem = {
  _id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "archived";
  version: number;
  is_active: boolean;
  incident_type?: "accident" | "road_breakdown" | "road_obstacle" | "other";
  createdAt?: string;
  updatedAt?: string;
  organization?: { _id?: string; code?: string; name: string };
};

export type TreeNode<T extends { _id: string }> = T & { children: TreeNode<T>[] };

export const buildUnitTree = <T extends { _id: string; parentUnit?: { _id?: string; name: string } }>(
  units: T[],
): TreeNode<T>[] => {
  const byId = new Map<string, TreeNode<T>>();
  for (const unit of units) {
    byId.set(unit._id, { ...unit, children: [] });
  }
  const roots: TreeNode<T>[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentUnit?._id;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent && parent._id !== node._id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};
