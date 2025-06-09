"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";
import { ReqType } from "@/types/declarations/selectInp";

export const createUser = async (data: ReqType["main"]["user"]["addUser"]["set"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "addUser",
      details: {
        set: {
          ...data,
        },
        get: {
          _id: 1,
          first_name: 1,
        },
      },
    },
    { token: token?.value }
  );

};
