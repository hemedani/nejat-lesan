"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const seedTownships = async (
  _id: string,
  details: ReqType["main"]["township"]["seedTownships"],
) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "township",
      act: "seedTownships",
      details,
    },
    { token: token?.value },
  );
};
