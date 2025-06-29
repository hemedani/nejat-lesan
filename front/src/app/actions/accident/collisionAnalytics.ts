"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const collisionAnalytics = async (details: ReqType["main"]["accident"]["collisionAnalytics"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "collisionAnalytics",
      details,
    },
    { token: token?.value }
  );
};


