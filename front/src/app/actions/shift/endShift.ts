"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function endPatrolShift(request: ReqType["main"]["shift"]["endShift"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "shift", act: "endShift", details: request }, { token: token?.value });
}
