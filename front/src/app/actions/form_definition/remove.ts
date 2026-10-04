"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["form_definition"]["remove"];

export async function removeFormDefinition(request: {
  set: Partial<Act["set"]>;
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "remove",
      details: { set: request.set, get: { success: 1 } },
    },
    { token: token?.value },
  );
}
