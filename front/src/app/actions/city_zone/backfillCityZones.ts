"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const backfillCityZones = async (
  details: ReqType["main"]["city_zone"]["backfillCityZones"],
) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "city_zone",
      act: "backfillCityZones",
      details,
    },
    { token: token?.value },
  );
};
