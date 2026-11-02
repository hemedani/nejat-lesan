"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { organizationDetailProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["add"];

export async function addOrganization(request: { set: Partial<Act["set"]>; get?: Partial<Act["get"]> }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "add",
      details: {
        set: request.set,
        get: { ...organizationDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
