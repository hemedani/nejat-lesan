"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { organizationListItemProjection } from "@/services/org-projections";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["gets"];

export async function getOrganizations(request: Partial<Act> = {}) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "gets",
      details: {
        set: { page: 1, limit: 100, ...request.set },
        get: { ...organizationListItemProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
