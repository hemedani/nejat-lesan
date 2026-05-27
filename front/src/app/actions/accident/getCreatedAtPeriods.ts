"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const getCreatedAtPeriods = async ({
  set,
  get,
}: ReqType["main"]["accident"]["getCreatedAtPeriods"]) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "getCreatedAtPeriods",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
