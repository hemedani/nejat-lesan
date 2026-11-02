"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const add = async (data: {
  name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  cityId: string;
}) => {
  const token = (await cookies()).get(AUTH_COOKIE);

  return await AppApi().send(
    {
      service: "main",
      model: "air_pollution_zone",
      act: "add",
      details: {
        set: {
          name: data.name,
          population: data.population,
          area: data.area,
          cityId: data.cityId,
        },
        get: {
          _id: 1,
          name: 1,
          population: 1,
          area: 1,
          city: {
            _id: 1,
            name: 1,
          },
        },
      },
    },
    { token: token?.value }
  );
};