"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reportListProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["accident"]["getReporterDashboard"];

export async function getReporterDashboard(request?: Partial<Request>) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send({ service: "main", model: "accident", act: "getReporterDashboard", details: {
    set: { page: 1, limit: 10, ...request?.set },
    get: { ...reportListProjection, ...request?.get } as never,
  } }, { token: token?.value });
}
