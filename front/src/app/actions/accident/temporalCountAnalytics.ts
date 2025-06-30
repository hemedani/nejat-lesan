"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const temporalCountAnalytics = async (details: ReqType["main"]["accident"]["temporalCountAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "temporalCountAnalytics",
      details,
    },
    { token: token?.value }
  );
};



