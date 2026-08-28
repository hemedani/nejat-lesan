"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function removeDevice(request: ReqType["main"]["user"]["removeDevice"]) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    { service: "main", model: "user", act: "removeDevice", details: { set: request.set, get: {} } },
    { token: token?.value },
  );
}
