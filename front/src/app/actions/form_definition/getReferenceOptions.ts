"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["form_definition"]["getReferenceOptions"];

export interface ReferenceOption {
  _id: string;
  name: string;
}

export async function getReferenceOptions(request: {
  set: Act["set"];
}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "getReferenceOptions",
      details: {
        set: request.set,
        // Want-marker, not a projection — see getForPatrol.ts. No cast needed.
        get: { model: 1, items: 1 },
      },
    },
    { token: token?.value },
  );
}
