"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["ware"]["gets"];

/**
 * Default projection.
 *
 * `ware.gets` passes `get` straight through to a Mongo aggregation, and an empty
 * projection is rejected with HTTP 501
 * ("Invalid $project :: projection specification must have at least one field").
 * So this must never default to `{}` — always send at least one field.
 */
const DEFAULT_PROJECTION = {
  _id: 1,
  name: 1,
  enName: 1,
  brand: 1,
  ware_type: 1,
  ware_class: 1,
  ware_group: 1,
  ware_model: 1,
  is_active: 1,
};

export async function getWareRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "ware", act: "gets", details: { set: { limit: 200, ...request.set }, get: { ...DEFAULT_PROJECTION, ...request.get } as never } }, { token: token?.value });
}
