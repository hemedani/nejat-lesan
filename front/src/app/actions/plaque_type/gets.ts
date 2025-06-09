"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({
  set,
  get,
}: ReqType["main"]["plaque_type"]["gets"]) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "plaque_type",
      act: "gets",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
