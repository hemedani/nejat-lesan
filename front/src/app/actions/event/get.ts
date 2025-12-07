"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const get = async (_id: string) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "event",
      act: "get",
      details: {
        set: {
          _id,
        },
        get: {
          _id: 1,
          name: 1,
          description: 1,
          dates: 1,
          registrer: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            father_name: 1,
            mobile: 1,
            gender: 1,
            national_number: 1,
            address: 1,
            level: 1,
            is_verified: 1,
          },
        },
      },
    },
    { token: token?.value }
  );
};
