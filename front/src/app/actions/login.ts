"use server";

import { AppApi } from "@/services/api";

export const loginAction = async ({ email, password }: { email: string; password: string }) => {
  return await AppApi().send({
    service: "main",
    model: "user",
    act: "login",
    details: {
      set: {
        email,
        password,
      },
      get: {
        token: 1,
        user: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          email: 1,
          national_number: 1,
          level: 1,
          settings: 1,
        },
      },
    },
  });
};