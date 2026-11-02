"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getModules(request: Partial<ReqType["main"]["app_modules"]["getModules"]> = {}) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "app_modules",
      act: "getModules",
      details: {
        set: {},
        get: { modules: 1, ...request.get },
      },
    },
    { token: token?.value },
  );
}

export interface ModuleFlag {
  key: "charts" | "incident_patrol" | "warehouse";
  enabled: boolean;
}

export interface GetModulesBody {
  modules: ModuleFlag[];
}
