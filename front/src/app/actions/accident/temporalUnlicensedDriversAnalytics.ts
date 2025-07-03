"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const temporalUnlicensedDriversAnalytics = async (
  details: ReqType["main"]["accident"]["temporalUnlicensedDriversAnalytics"],
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "temporalUnlicensedDriversAnalytics",
      details,
    },
    { token: token?.value },
  );
};

