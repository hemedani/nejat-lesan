"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["organization"]["remove"];

export async function removeOrganization(request: { set: Pick<Act["set"], "_id"> }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "organization",
      act: "remove",
      details: {
        set: request.set,
        get: { success: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
