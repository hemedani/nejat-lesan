"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reportListProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["accident"]["getManagerDashboard"];

export async function getManagerDashboard(request?: Partial<Request>) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "accident", act: "getManagerDashboard", details: {
    set: { page: 1, limit: 20, ...request?.set },
    get: { ...reportListProjection, ...request?.get } as never,
  } }, { token: token?.value });
}
