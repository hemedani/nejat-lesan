"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unitDetailProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["unit"]["updateRelations"];

export async function updateUnitRelations(request: { set: Partial<Act["set"]>; get?: Partial<Act["get"]> }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "unit",
      act: "updateRelations",
      details: {
        set: request.set,
        get: { ...unitDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
