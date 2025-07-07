"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const eventCollisionAnalytics = async (details: ReqType["main"]["accident"]["eventCollisionAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "eventCollisionAnalytics",
      details,
    },
    { token: token?.value }
  );
};



