"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const getUser = async (_id: string) => {
  const token = (await cookies()).get("token");
  return await AppApi().send({
    service: "main",
    model: "user",
    act: "getUser",
    details: {
      set: {
        _id,
      },
      get: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        father_name: 1,
        mobile: 1,
        gender: 1,
        birth_date: 1,
        national_number: 1,
        address: 1,
        level: 1,
        createdAt: 1,
        updatedAt: 1,
        avatar: {
          _id: 1,
          name: 1,
          type: 1,
          size: 1,
        },
      },
    },
  }, { token: token?.value });
};
