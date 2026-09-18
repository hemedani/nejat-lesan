"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["goods_request"]["add"];

/** Registers a request for goods from the unit warehouse. */
export async function addGoodsRequest(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "goods_request",
      act: "add",
      details: { set: request.set, get: (request.get ?? { _id: 1, status: 1 }) as never },
    },
    { token: token?.value },
  );
}
