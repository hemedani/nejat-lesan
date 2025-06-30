"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const totalReasonAnalytics = async (details: ReqType["main"]["accident"]["totalReasonAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "totalReasonAnalytics",
      details,
    },
    { token: token?.value }
  );
};



