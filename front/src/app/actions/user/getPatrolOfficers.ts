"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getPatrolOfficers(request: ReqType["main"]["user"]["getPatrolOfficers"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "user", act: "getPatrolOfficers", details: request }, { token: token?.value });
}
