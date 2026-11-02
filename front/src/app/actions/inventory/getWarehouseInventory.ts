"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["inventory"]["getWarehouseInventory"];

/**
 * Warehouse dashboard for one unit: central + unit warehouses with their
 * stock levels. The backend resolves scope from the caller's roles, so this
 * act returns only what the caller may see.
 */
export async function getWarehouseInventory(request: { set: Act["set"]; get?: Act["get"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "inventory",
      act: "getWarehouseInventory",
      details: { set: request.set, get: (request.get ?? { rows: 1 }) as never },
    },
    { token: token?.value },
  );
}
