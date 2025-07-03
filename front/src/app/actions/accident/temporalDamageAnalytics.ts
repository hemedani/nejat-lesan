"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const temporalDamageAnalytics = async (details: ReqType["main"]["accident"]["temporalDamageAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "temporalDamageAnalytics",
      details,
    },
    { token: token?.value }
  );
};

