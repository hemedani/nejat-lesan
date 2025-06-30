"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const humanReasonAnalytics = async (details: ReqType["main"]["accident"]["humanReasonAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "humanReasonAnalytics",
      details,
    },
    { token: token?.value }
  );
};




