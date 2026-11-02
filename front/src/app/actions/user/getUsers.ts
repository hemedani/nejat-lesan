"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const getUsers = async ({ set, get }: ReqType["main"]["user"]["getUsers"]) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  const getUsers = await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "getUsers",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );

  if (getUsers.success) return getUsers.body;
};
