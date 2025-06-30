"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const vehicleReasonAnalytics = async (details: ReqType["main"]["accident"]["vehicleReasonAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "vehicleReasonAnalytics",
      details,
    },
    { token: token?.value }
  );
};





