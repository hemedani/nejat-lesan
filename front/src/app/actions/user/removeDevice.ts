"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function removeDevice(request: ReqType["main"]["user"]["removeDevice"]) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    { service: "main", model: "user", act: "removeDevice", details: { set: request.set, get: {} } },
    { token: token?.value },
  );
}
