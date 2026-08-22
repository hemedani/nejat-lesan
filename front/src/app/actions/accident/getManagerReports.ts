"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { reportListProjection } from "@/services/patrol-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Request = ReqType["main"]["accident"]["getManagerReports"];

export async function getManagerReports(request: Request) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "accident", act: "getManagerReports", details: {
    set: request.set,
    get: { ...reportListProjection, ...request.get } as never,
  } }, { token: token?.value });
}
