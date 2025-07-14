"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const spatialSafetyIndexAnalytics = async (details: ReqType["main"]["accident"]["spatialSafetyIndexAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "spatialSafetyIndexAnalytics",
      details,
    },
    { token: token?.value }
  );
};

