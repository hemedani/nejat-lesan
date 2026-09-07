"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unitDetailProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["unit"]["update"];

export async function updateUnit(request: { set: Partial<Act["set"]>; get?: Partial<Act["get"]> }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "unit",
      act: "update",
      details: {
        set: request.set,
        get: { ...unitDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
