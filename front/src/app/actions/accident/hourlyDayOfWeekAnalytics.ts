"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const hourlyDayOfWeekAnalytics = async (details: ReqType["main"]["accident"]["hourlyDayOfWeekAnalytics"]) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "hourlyDayOfWeekAnalytics",
      details,
    },
    { token: token?.value }
  );
};

