"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const areaUsageAnalytics = async (details: ReqType["main"]["accident"]["areaUsageAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "areaUsageAnalytics",
      details,
    },
    { token: token?.value }
  );
};
