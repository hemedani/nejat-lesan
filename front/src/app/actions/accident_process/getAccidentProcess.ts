"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["accident_process"]["get"];

const PROCESS_GET = {
  _id: 1,
  name: 1,
  description: 1,
  status: 1,
  version: 1,
  is_active: 1,
  incident_type: 1,
  steps: 1,
  createdAt: 1,
  updatedAt: 1,
};

export async function getAccidentProcess(request: Partial<Act>) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "accident_process",
      act: "get",
      details: {
        set: { ...request.set },
        get: { ...PROCESS_GET, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
