"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const CountUsers = async ({
  set,
  get,
}: ReqType["main"]["user"]["countUsers"]) => {
  const token = (await cookies()).get("token");
  const countUsers = await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "countUsers",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );

  if (countUsers.success) return countUsers.body;
};
