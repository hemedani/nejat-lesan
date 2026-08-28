"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getEmergencies(request: ReqType["main"]["emergency"]["gets"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "emergency", act: "gets", details: request }, { token: token?.value });
}
