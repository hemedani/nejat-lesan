"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["goods_request"]["count"];

export async function countGoodsRequestRows(request: { set?: Partial<Act["set"]> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "goods_request", act: "count", details: { set: request.set ?? {}, get: { qty: 1 } as never } }, { token: token?.value });
}
