"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["goods_receipt"]["add"];

/** Records a goods receipt; the backend adds the items to unit stock. */
export async function addGoodsReceipt(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "goods_receipt",
      act: "add",
      details: { set: request.set, get: (request.get ?? { _id: 1 }) as never },
    },
    { token: token?.value },
  );
}
