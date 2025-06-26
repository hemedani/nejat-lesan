"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const roadDefectsAnalytics = async (details: ReqType["main"]["accident"]["roadDefectsAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "roadDefectsAnalytics",
      details,
    },
    { token: token?.value }
  );
};
