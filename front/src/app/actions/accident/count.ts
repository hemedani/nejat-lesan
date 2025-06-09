"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const count = async ({ set, get }: ReqType["main"]["accident"]["count"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "count",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
