"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({
  set,
  get,
}: ReqType["main"]["plaque_usage"]["gets"]) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "plaque_usage",
      act: "gets",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
