"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["accident_process"]["duplicate"];

export async function duplicateAccidentProcess(request: { set: Act["set"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "accident_process",
      act: "duplicate",
      details: {
        set: request.set,
        get: { _id: 1, name: 1, status: 1, version: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
