"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const spatialLightAnalytics = async (details: ReqType["main"]["accident"]["spatialLightAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "spatialLightAnalytics",
      details,
    },
    { token: token?.value }
  );
};

