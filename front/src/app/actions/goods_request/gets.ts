"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["goods_request"]["gets"];

export async function getGoodsRequestRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "goods_request", act: "gets", details: { set: request.set ?? {}, get: (request.get ?? {}) as never } }, { token: token?.value });
}
