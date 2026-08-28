"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getAnnouncements(request: ReqType["main"]["announcement"]["gets"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "announcement", act: "gets", details: request }, { token: token?.value });
}
