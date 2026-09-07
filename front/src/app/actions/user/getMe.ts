"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const getMe = async (get?: ReqType["main"]["user"]["getMe"]["get"]) => {
  const token = (await cookies()).get("token");

  const getFields = get || {
    _id: 1,
    first_name: 1,
    last_name: 1,
    gender: 1,
    mobile: 1,
    email: 1,
    national_number: 1,
    level: 1,
    roles: 1,
    settings: 1,
    organizations: {
      _id: 1,
      code: 1,
      name: 1,
      enName: 1,
      is_active: 1,
    },
    units: {
      _id: 1,
      code: 1,
      name: 1,
      type: 1,
      is_active: 1,
    },
  };

  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "getMe",
      details: {
        set: {},
        get: getFields,
      },
    },
    { token: token?.value },
  );
};
