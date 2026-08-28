"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getSyncStatus(request: ReqType["main"]["accident"]["getSyncStatus"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "accident", act: "getSyncStatus", details: request }, { token: token?.value });
}
