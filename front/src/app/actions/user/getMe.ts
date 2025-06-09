"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const getMe = async (get?: ReqType["main"]["user"]["getMe"]["get"]) => {
  const token = (await cookies()).get("token");
  get = get || {
    _id: 1,
    first_name: 1,
    last_name: 1,
    gender: 1,
    mobile: 1,
    national_number: 1,
    level: 1,
  };

  return await AppApi().send({
    service: "main",
    model: "user",
    act: "getMe",
    details: {
      set: {},
      get,
    },
  }, { token: token?.value });
};
