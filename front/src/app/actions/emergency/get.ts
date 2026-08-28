"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getEmergency(request: ReqType["main"]["emergency"]["get"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "emergency", act: "get", details: request }, { token: token?.value });
}
