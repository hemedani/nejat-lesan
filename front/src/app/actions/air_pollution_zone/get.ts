"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const get = async (
  _id: string,
  get?: ReqType["main"]["air_pollution_zone"]["get"]["get"]
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "air_pollution_zone",
      act: "get",
      details: {
        set: {
          _id,
        },
        get: {
          _id: 1,
          name: 1,
          area: 1,
          ...get,
        },
      },
    },
    { token: token?.value }
  );
};