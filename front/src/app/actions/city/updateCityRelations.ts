"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const updateCityRelations = async (cityId: string, provinceId?: string) => {
  const token = (await cookies()).get(AUTH_COOKIE);

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
