"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({
  set,
  get,
}: ReqType["main"]["body_insurance_co"]["gets"]) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "body_insurance_co",
      act: "gets",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
