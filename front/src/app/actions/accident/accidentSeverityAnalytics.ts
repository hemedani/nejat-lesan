"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const accidentSeverityAnalytics = async (details: ReqType["main"]["accident"]["accidentSeverityAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "accidentSeverityAnalytics",
      details,
    },
    { token: token?.value }
  );
};
