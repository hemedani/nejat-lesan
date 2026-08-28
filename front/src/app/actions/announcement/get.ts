"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getAnnouncement(request: ReqType["main"]["announcement"]["get"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "announcement", act: "get", details: request }, { token: token?.value });
}
