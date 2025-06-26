"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const monthlyHolidayAnalytics = async (details: ReqType["main"]["accident"]["monthlyHolidayAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "monthlyHolidayAnalytics",
      details,
    },
    { token: token?.value }
  );
};

