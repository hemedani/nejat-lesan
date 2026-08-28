"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getVehicles(request: ReqType["main"]["vehicle"]["gets"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "vehicle", act: "gets", details: request }, { token: token?.value });
}
