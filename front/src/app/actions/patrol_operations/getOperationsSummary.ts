"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getOperationsSummary(request: ReqType["main"]["patrol_operations"]["getOperationsSummary"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "patrol_operations", act: "getOperationsSummary", details: request }, { token: token?.value });
}
