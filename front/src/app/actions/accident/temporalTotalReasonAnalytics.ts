"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const temporalTotalReasonAnalytics = async (
  details: ReqType["main"]["accident"]["temporalTotalReasonAnalytics"],
) => {
  const token = (await cookies()).get("token");
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
