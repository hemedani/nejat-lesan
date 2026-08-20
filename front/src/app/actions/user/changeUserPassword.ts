"use server";

import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const changeUserPassword = async ({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "changeUserPassword",
      details: {
        set: {
          userId,
          newPassword,
        },
        get: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          level: 1,
        },
      },
    },
    { token: token?.value },
  );
};