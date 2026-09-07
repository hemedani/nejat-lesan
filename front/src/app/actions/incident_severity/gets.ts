"use server";

import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({ set, get }: ReqType["main"]["incident_severity"]["gets"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "incident_severity",
      act: "gets",
      details: { set, get },
    },
    { token: token?.value },
  );
};
