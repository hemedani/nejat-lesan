"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["inventory"]["gets"];

/**
 * `inventory.gets` passes `get` straight to a Mongo aggregation, and an empty
 * projection is rejected with HTTP 501
 * ("Invalid $project :: projection specification must have at least one field").
 * Never default to `{}`.
 */
const DEFAULT_PROJECTION = {
  _id: 1,
  quantity: 1,
  min_quantity: 1,
  max_quantity: 1,
  batch_no: 1,
  expiration_date: 1,
  location: 1,
  unit: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1 },
};

export async function getInventoryRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "inventory", act: "gets", details: { set: request.set ?? {}, get: { ...DEFAULT_PROJECTION, ...request.get } as never } }, { token: token?.value });
}
