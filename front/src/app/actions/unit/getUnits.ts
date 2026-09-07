"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unitListItemProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["unit"]["gets"];

export async function getUnits(request: Partial<Act> = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "unit",
      act: "gets",
      details: {
        set: { page: 1, limit: 100, ...request.set },
        get: { ...unitListItemProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
