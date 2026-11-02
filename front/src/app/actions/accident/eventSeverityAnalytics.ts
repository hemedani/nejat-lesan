"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const eventSeverityAnalytics = async (details: ReqType["main"]["accident"]["eventSeverityAnalytics"]) => {
  const token = (await cookies()).get(AUTH_COOKIE);
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


