"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getUserDevices(request: ReqType["main"]["user"]["getUserDevices"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "user", act: "getUserDevices", details: request }, { token: token?.value });
}
