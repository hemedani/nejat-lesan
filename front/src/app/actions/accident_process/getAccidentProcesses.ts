"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { accidentProcessListItemProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["accident_process"]["gets"];

export async function getAccidentProcesses(request: Partial<Act> = {}) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "accident_process",
      act: "gets",
      details: {
        set: { page: 1, limit: 20, ...request.set },
        get: { ...accidentProcessListItemProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
