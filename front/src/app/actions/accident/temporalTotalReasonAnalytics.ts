"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const temporalTotalReasonAnalytics = async (
  details: ReqType["main"]["accident"]["temporalTotalReasonAnalytics"],
) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "temporalTotalReasonAnalytics",
      details,
    },
    { token: token?.value },
  );
};
