"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const seedCityZones = async (
  _id: string,
  details: ReqType["main"]["city_zone"]["seedCityZones"],
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "city_zone",
      act: "seedCityZones",
      details,
    },
    { token: token?.value },
  );
};
