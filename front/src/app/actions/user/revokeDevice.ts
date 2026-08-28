"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function revokeDevice(request: ReqType["main"]["user"]["revokeDevice"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "user", act: "revokeDevice", details: request }, { token: token?.value });
}
