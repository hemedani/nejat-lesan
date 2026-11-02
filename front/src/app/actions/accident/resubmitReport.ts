"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reportDetailProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["accident"]["resubmitReport"];

export async function resubmitReport(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send({ service: "main", model: "accident", act: "resubmitReport", details: {
    set: request.set,
    get: { ...reportDetailProjection, ...request.get } as never,
  } }, { token: token?.value });
}
