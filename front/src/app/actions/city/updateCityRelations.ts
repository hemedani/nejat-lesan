"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const updateCityRelations = async (cityId: string, provinceId?: string) => {
  const token = (await cookies()).get("token");

  const set: Record<string, unknown> = { _id: cityId };
  if (provinceId !== undefined) {
    set.province = provinceId;
  }

  return await AppApi().send(
    {
      service: "main",
      model: "city",
      act: "updateCityRelations",
      details: {
        set,
        get: {
          _id: 1,
          name: 1,
          province: {
            _id: 1,
            name: 1,
          },
        },
      },
    },
    { token: token?.value },
  );
};
