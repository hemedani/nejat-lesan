"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";
import { ReqType } from "@/types/declarations/selectInp";

export const createUser = async (data: ReqType["main"]["user"]["addUser"]["set"]) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "addUser",
      details: {
        set: {
          ...data,
          email: data.email.trim().toLowerCase(),
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
