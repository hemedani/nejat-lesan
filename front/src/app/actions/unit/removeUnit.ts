"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["unit"]["remove"];

export async function removeUnit(request: { set: Pick<Act["set"], "_id"> }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "unit",
      act: "remove",
      details: {
        set: request.set,
        get: { success: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
