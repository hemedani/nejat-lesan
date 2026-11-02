"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const deleteUser = async (userId: string, hardCascade: boolean) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "removeUser",
      details: {
        set: { _id: userId, hardCascade },
        get: { success: 1 },
      },
    },
    { token: token?.value }
  );
};
