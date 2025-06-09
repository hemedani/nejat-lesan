"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const count = async ({ set, get }: ReqType["main"]["road_situation"]["count"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "road_situation",
      act: "count",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
