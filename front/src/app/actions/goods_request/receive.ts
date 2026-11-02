"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["goods_request"]["receive"];

/** Confirms the requester received an issued goods request. */
export async function receiveGoodsRequest(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "goods_request",
      act: "receive",
      details: { set: request.set, get: (request.get ?? { _id: 1, status: 1 }) as never },
    },
    { token: token?.value },
  );
}
