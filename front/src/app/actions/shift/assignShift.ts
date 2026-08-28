"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function assignPatrolShift(request: ReqType["main"]["shift"]["assignShift"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "shift", act: "assignShift", details: request }, { token: token?.value });
}
