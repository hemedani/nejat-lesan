"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["consumption"]["gets"];

export async function getConsumptionRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "consumption", act: "gets", details: { set: request.set ?? {}, get: (request.get ?? {}) as never } }, { token: token?.value });
}
