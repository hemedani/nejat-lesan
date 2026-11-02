"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["app_modules"]["setModules"];

export interface ModuleFlag {
  key: "charts" | "incident_patrol" | "warehouse";
  enabled: boolean;
}

export async function setModules(request: { set: Act["set"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "app_modules",
      act: "setModules",
      details: {
        set: request.set,
        get: { success: 1 },
      },
    },
    { token: token?.value },
  );
}
