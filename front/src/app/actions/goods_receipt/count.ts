"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["goods_receipt"]["count"];

export async function countGoodsReceiptRows(request: { set?: Partial<Act["set"]> } = {}) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send({ service: "main", model: "goods_receipt", act: "count", details: { set: request.set ?? {}, get: { qty: 1 } as never } }, { token: token?.value });
}
