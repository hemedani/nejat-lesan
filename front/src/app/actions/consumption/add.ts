"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["consumption"]["add"];

/** Registers consumption, which removes the quantity from unit stock. */
export async function addConsumption(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "consumption",
      act: "add",
      details: { set: request.set, get: (request.get ?? { _id: 1 }) as never },
    },
    { token: token?.value },
  );
}
