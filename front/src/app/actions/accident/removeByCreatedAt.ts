"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const removeByCreatedAt = async (data: {
  createdAt: number;
  hoursBefore?: number;
  hoursAfter?: number;
}) => {
  const token = (await cookies()).get(AUTH_COOKIE);

  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "removeByCreatedAt",
      details: {
        set: data,
        get: { success: 1, deletedCount: 1 },
      },
    },
    { token: token?.value }
  );
};
