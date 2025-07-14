"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const add = async (data: {
  name: string;
  english_name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  center_location: {
    type: "Point";
    coordinates: number[];
  };
  provinceId: string;
  isCenter: boolean;
}) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "city",
      act: "add",
      details: {
        set: {
          name: data.name,
          english_name: data.english_name,
          population: data.population,
          area: data.area,
          center_location: data.center_location,
          provinceId: data.provinceId,
          isCenter: data.isCenter,
        },
        get: {
          _id: 1,
          name: 1,
          english_name: 1,
          population: 1,
          area: 1,
          center_location: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    },
    { token: token?.value },
  );
};
