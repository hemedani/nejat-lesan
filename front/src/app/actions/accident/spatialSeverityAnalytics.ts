"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const spatialSeverityAnalytics = async (details: ReqType["main"]["accident"]["spatialSeverityAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "spatialSeverityAnalytics",
      details,
    },
    { token: token?.value }
  );
};

