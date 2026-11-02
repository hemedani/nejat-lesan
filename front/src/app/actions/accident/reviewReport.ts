"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reviewProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["accident"]["reviewReport"];

export async function reviewReport(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send({ service: "main", model: "accident", act: "reviewReport", details: {
    set: request.set,
    get: { ...reviewProjection, ...request.get } as never,
  } }, { token: token?.value });
}
