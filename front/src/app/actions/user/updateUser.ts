"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export type UpdateUserSet = ReqType["main"]["user"]["updateUser"]["set"];

export const updateUserPure = async (data: UpdateUserSet) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "updateUser",
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
