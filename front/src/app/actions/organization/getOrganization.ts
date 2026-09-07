"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { organizationDetailProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["get"];

export async function getOrganization(request: Partial<Act>) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "get",
      details: {
        set: { ...request.set },
        get: { ...organizationDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
