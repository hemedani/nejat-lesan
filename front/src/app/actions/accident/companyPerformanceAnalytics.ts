"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const companyPerformanceAnalytics = async (details: ReqType["main"]["accident"]["companyPerformanceAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "companyPerformanceAnalytics",
      details,
    },
    { token: token?.value }
  );
};




