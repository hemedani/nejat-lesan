"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["inventory"]["checkReorder"];

/** Flags every item at or below its reorder point for a unit or organization. */
export async function checkReorder(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "inventory",
      act: "checkReorder",
      details: { set: request.set, get: (request.get ?? { created: 1, skipped: 1 }) as never },
    },
    { token: token?.value },
  );
}
