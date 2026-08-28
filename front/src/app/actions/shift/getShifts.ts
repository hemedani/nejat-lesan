"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getPatrolShifts(request: ReqType["main"]["shift"]["getShifts"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "shift", act: "getShifts", details: request }, { token: token?.value });
}
