"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["accident_process"]["add"];

export async function addAccidentProcess(request: { set: Partial<Act["set"]>; get?: Partial<Act["get"]> }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "accident_process",
      act: "add",
      details: {
        set: request.set,
        get: { _id: 1, name: 1, status: 1, version: 1, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
