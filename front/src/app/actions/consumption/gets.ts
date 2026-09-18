"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["consumption"]["gets"];

/**
 * `consumption.gets` passes `get` straight to a Mongo aggregation, and an empty
 * projection is rejected with HTTP 501
 * ("Invalid $project :: projection specification must have at least one field").
 * Never default to `{}`.
 */
const DEFAULT_PROJECTION = {
  _id: 1,
  quantity: 1,
  consumed_at: 1,
  reason: 1,
  consumed_for: 1,
  notes: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1 },
  consumed_by: { _id: 1, first_name: 1, last_name: 1 },
};

export async function getConsumptionRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "consumption", act: "gets", details: { set: request.set ?? {}, get: { ...DEFAULT_PROJECTION, ...request.get } as never } }, { token: token?.value });
}
