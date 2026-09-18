"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["inventory"]["adjust"];

/** Sets an absolute stock level (stock-taking), recording a stock movement. */
export async function adjustInventoryRow(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "inventory",
      act: "adjust",
      details: { set: request.set, get: (request.get ?? { _id: 1, quantity: 1 }) as never },
    },
    { token: token?.value },
  );
}
