"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function removeVehicle(request: ReqType["main"]["vehicle"]["remove"]) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send({ service: "main", model: "vehicle", act: "remove", details: request }, { token: token?.value });
}
