"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["consumption"]["count"];

export async function countConsumptionRows(request: { set?: Partial<Act["set"]> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "consumption", act: "count", details: { set: request.set ?? {}, get: { qty: 1 } as never } }, { token: token?.value });
}
