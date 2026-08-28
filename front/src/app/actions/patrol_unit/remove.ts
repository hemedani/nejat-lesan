"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function removePatrolUnit(request: ReqType["main"]["patrol_unit"]["remove"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "patrol_unit", act: "remove", details: request }, { token: token?.value });
}
