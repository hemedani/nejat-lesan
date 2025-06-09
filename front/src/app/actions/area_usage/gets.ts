"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({
  set,
  get,
}: ReqType["main"]["area_usage"]["gets"]) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "area_usage",
      act: "gets",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
