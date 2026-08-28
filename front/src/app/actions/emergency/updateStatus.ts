"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function updateEmergencyStatus(request: ReqType["main"]["emergency"]["updateStatus"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "emergency", act: "updateStatus", details: request }, { token: token?.value });
}
