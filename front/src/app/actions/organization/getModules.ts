"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["getModules"];

export async function getOrganizationModules(request: { set: Partial<Act["set"]>; get?: Partial<Act["get"]> }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "getModules",
      details: {
        set: request.set,
        get: { deployment: 1, modules: 1, effective: 1, ...request.get },
      },
    },
    { token: token?.value },
  );
}

export interface OrganizationModulesBody {
  deployment: string[];
  modules: { key: "charts" | "incident_patrol" | "warehouse"; enabled: boolean }[];
  effective: string[];
}
