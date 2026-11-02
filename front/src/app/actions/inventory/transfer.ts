"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["inventory"]["transfer"];

/** Moves stock between two units (typically central → unit warehouse). */
export async function transferInventory(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "inventory",
      act: "transfer",
      details: { set: request.set, get: (request.get ?? {}) as never },
    },
    { token: token?.value },
  );
}
