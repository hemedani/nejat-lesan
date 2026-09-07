"use server";

import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

type Set = ReqType["main"]["user"]["addOrRemoveRoles"]["set"];

export async function updateUserRoles(data: Set) {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "addOrRemoveRoles",
      details: {
        set: {
          ...data,
        },
        get: {
          _id: 1,
          roles: 1,
        },
      },
    },
    { token: token?.value },
  );
}
