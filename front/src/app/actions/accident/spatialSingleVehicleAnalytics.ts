"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const spatialSingleVehicleAnalytics = async (details: ReqType["main"]["accident"]["spatialSingleVehicleAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "spatialSingleVehicleAnalytics",
      details,
    },
    { token: token?.value }
  );
};

