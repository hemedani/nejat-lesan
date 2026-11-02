"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const count = async ({
  set,
  get,
}: ReqType["main"]["air_pollution_zone"]["count"]) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "air_pollution_zone",
      act: "count",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};