"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const spatialCollisionAnalytics = async (details: ReqType["main"]["accident"]["spatialCollisionAnalytics"]) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "spatialCollisionAnalytics",
      details,
    },
    { token: token?.value }
  );
};


