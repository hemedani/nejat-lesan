"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { FORM_DEFINITION_PROJECTION } from "./projection";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["form_definition"]["update"];

export async function updateFormDefinition(request: {
  set: Partial<Act["set"]>;
  get?: Partial<Act["get"]>;
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "update",
      details: {
        set: request.set,
        get: { ...FORM_DEFINITION_PROJECTION, ...request.get } as never,
      },
    },
    { token: token?.value },
  );
}
