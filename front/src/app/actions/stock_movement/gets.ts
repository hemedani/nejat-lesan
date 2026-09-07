"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["stock_movement"]["gets"];

export async function getStockMovementRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "stock_movement", act: "gets", details: { set: request.set ?? {}, get: (request.get ?? {}) as never } }, { token: token?.value });
}
