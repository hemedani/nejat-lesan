"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["goods_request"]["issue"];

export async function issueGoodsRequest(request: { set: Partial<Act["set"]> }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    { service: "main", model: "goods_request", act: "issue", details: { set: request.set, get: { _id: 1, status: 1 } as never } },
    { token: token?.value },
  );
}
