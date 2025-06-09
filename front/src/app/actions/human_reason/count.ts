"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const count = async ({ set, get }: ReqType["main"]["human_reason"]["count"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "human_reason",
      act: "count",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
