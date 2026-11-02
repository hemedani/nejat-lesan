"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["setModules"];

export async function setOrganizationModules(request: { set: Act["set"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "setModules",
      details: {
        set: request.set,
        get: { success: 1 },
      },
    },
    { token: token?.value },
  );
}
