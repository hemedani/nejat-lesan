"use server";

import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({ set, get }: ReqType["main"]["vehicle_type"]["gets"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "vehicle_type",
      act: "gets",
      details: { set, get },
    },
    { token: token?.value },
  );
};
