"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getPoliceStations(request: ReqType["main"]["police_station"]["gets"]) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "police_station", act: "gets", details: request }, { token: token?.value });
}
