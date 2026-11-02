"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const add = async (name: string) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "human_reason",
      act: "add",
      details: {
        set: {
          name,
        },
        get: {
          name: 1,
        },
      },
    },
    { token: token?.value }
  );
};
