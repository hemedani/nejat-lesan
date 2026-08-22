"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reviewProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["accident"]["reviewReport"];

export async function reviewReport(request: Request) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "accident", act: "reviewReport", details: {
    set: request.set,
    get: { ...reviewProjection, ...request.get } as never,
  } }, { token: token?.value });
}
