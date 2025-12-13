"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const get = async (
  _id: string,
  get: ReqType["main"]["event"]["get"]["get"],
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "event",
      act: "get",
      details: {
        set: {
          _id,
        },
        get,
      },
    },
    { token: token?.value },
  );
};
