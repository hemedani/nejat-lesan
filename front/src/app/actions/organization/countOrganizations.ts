"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["count"];

export async function countOrganizations(request: Partial<Act> = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "count",
      details: {
        set: request.set ?? {},
        get: { qty: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
