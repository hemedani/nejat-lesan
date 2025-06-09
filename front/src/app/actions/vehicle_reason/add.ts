"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const add = async (name: string) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "vehicle_reason",
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
