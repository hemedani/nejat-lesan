"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const seedTrafficZones = async (
  cityId: string,
  details: ReqType["main"]["traffic_zone"]["seedTrafficZones"],
) => {
  const token = (await cookies()).get(AUTH_COOKIE);
  return await AppApi().send(
    {
      service: "main",
      model: "traffic_zone",
      act: "seedTrafficZones",
      details,
    },
    { token: token?.value },
  );
};