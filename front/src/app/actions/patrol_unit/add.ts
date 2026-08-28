"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function addPatrolUnit(request: ReqType["main"]["patrol_unit"]["add"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "patrol_unit", act: "add", details: request }, { token: token?.value });
}
