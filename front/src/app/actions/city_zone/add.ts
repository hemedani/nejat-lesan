"use server";
import { AppApi } from "@/services/api";

import { cookies } from "next/headers";

export const add = async (data: {
  name: string;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  cityId: string;
}) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "city_zone",
      act: "add",
      details: {
        set: {
          name: data.name,
          area: data.area,
          cityId: data.cityId,
        },
        get: {
          _id: 1,
          name: 1,
          area: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    },
    { token: token?.value },
  );
};
