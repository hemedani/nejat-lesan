"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["form_definition"]["activate"];

export async function activateFormDefinition(request: {
  set: Act["set"];
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "activate",
      details: {
        set: request.set,
        get: { success: 1, version: 1, status: 1, message: 1 } as never,
      },
    },
    { token: token?.value },
  );
}
