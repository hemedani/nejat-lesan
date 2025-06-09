"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const get = async (_id: string, get?: ReqType["main"]["collision_type"]["get"]["get"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "collision_type",
      act: "get",
      details: {
        set: {
          _id,
        },
        get: {
          _id: 1,
          name: 1,
          ...get
        },
      },
    },
    { token }
  );
};
