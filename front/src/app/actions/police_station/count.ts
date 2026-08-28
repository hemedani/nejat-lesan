"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function countPoliceStations(request: ReqType["main"]["police_station"]["count"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "police_station", act: "count", details: request }, { token: token?.value });
}
