"use server";

import { AppApi } from "@/services/api";

export const loginAction = async ({
  national_number,
  code,
}: {
  national_number: string;
  code: string;
}) => {
  return await AppApi().send({
    service: "main",
    model: "user",
    act: "login",
    details: {
      set: {
        national_number,
        code,
      },
      get: {
        token: 1,
        user: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          national_number: 1,
          level: 1
        },
      },
    },
  });
};
