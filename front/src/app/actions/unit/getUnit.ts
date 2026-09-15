"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { unitDetailProjection } from "@/services/org-projections";
import { asSingleItemResponse } from "@/utils/api-response";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["unit"]["get"];

export async function getUnit(request: Partial<Act>) {
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "unit",
      act: "get",
      details: {
        set: { ...request.set },
        get: { ...unitDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
  return asSingleItemResponse(response);
}
