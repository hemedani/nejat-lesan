"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["accident_process"]["duplicate"];

export async function duplicateAccidentProcess(request: { set: Act["set"] }) {
  const token = (await cookies()).get("token");
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
