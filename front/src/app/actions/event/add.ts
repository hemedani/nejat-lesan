"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const add = async (
  name: string,
  description: string,
  dates: Array<{
    from: string;
    to: string;
    startEntireRange: string;
    endEntireRange: string;
  }>,
) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "event",
      act: "add",
      details: {
        set: {
          name,
          description,
          dates,
        },
        get: {
          _id: 1,
          name: 1,
          description: 1,
          dates: 1,
        },
      },
    },
    { token: token?.value },
  );
};
