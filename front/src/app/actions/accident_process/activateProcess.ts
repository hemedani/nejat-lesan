"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["accident_process"]["activate"];

export async function activateAccidentProcess(request: { set: Act["set"] }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "accident_process",
      act: "activate",
      details: {
        set: request.set,
        get: { success: 1, version: 1, status: 1, message: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
