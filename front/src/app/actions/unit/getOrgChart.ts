"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["unit"]["getOrgChart"];

export async function getOrgChart(request: Partial<Act>) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "unit",
      act: "getOrgChart",
      details: {
        set: { ...request.set },
        get: { units: 0, organization: 0, stats: 0, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
