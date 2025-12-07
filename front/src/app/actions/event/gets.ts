"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const gets = async (details: {
  set: {
    limit: number;
    page: number;
    skip?: number;
    name?: string; // Adding name for search functionality
  };
  get: {
    _id?: 0 | 1;
    name?: 0 | 1;
    description?: 0 | 1;
    dates?: 0 | 1;
    registrer?: {
      _id?: 0 | 1;
      first_name?: 0 | 1;
      last_name?: 0 | 1;
      father_name?: 0 | 1;
      mobile?: 0 | 1;
      gender?: 0 | 1;
      national_number?: 0 | 1;
      address?: 0 | 1;
      level?: 0 | 1;
      is_verified?: 0 | 1;
    };
  };
}) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "event",
      act: "gets",
      details,
    },
    { token: token?.value },
  );
};
