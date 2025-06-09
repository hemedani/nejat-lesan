"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const remove = async (_id: string, hardCascade: boolean) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "city",
      act: "remove",
      details: {
        set: { _id, hardCascade },
        get: { success: 1 },
      },
    },
    { token: token?.value }
  );
};
