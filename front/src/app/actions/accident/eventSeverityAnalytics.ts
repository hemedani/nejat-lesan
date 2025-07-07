"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const eventSeverityAnalytics = async (details: ReqType["main"]["accident"]["eventSeverityAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "eventSeverityAnalytics",
      details,
    },
    { token: token?.value }
  );
};


