"use server";

import { AppApi } from "@/services/api";

export const setGhostPassword = async () => {
  return await AppApi().send({
    service: "main",
    model: "user",
    act: "setGhostPassword",
    details: {
      set: {},
      get: {
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
  });
};