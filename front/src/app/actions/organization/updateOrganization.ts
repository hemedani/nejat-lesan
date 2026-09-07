"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { organizationDetailProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["update"];

export async function updateOrganization(request: { set: Partial<Act["set"]>; get?: Partial<Act["get"]> }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "update",
      details: {
        set: request.set,
        get: { ...organizationDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
