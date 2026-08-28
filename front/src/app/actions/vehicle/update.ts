"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function updateVehicle(request: ReqType["main"]["vehicle"]["update"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "vehicle", act: "update", details: request }, { token: token?.value });
}
