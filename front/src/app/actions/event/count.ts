"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const count = async (details: {
  set: {
    name?: string; // Adding name for search functionality
    filters?: {
      [key: string]: any;
    };
  };
  get: {
    count: number;
  };
}) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "event",
      act: "count",
      details,
    },
    { token: token?.value },
  );
};
