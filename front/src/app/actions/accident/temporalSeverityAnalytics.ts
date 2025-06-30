"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const temporalSeverityAnalytics = async (details: ReqType["main"]["accident"]["temporalSeverityAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "temporalSeverityAnalytics",
      details,
    },
    { token: token?.value }
  );
};




