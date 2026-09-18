"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["goods_request"]["gets"];

/**
 * `goods_request.gets` passes `get` straight to a Mongo aggregation, and an empty
 * projection is rejected with HTTP 501
 * ("Invalid $project :: projection specification must have at least one field").
 * Never default to `{}`.
 */
const DEFAULT_PROJECTION = {
  _id: 1,
  request_number: 1,
  status: 1,
  quantity: 1,
  priority: 1,
  notes: 1,
  origin: 1,
  requested_at: 1,
  approved_at: 1,
  issued_at: 1,
  received_at: 1,
  createdAt: 1,
  unit: { _id: 1, name: 1 },
  ware: { _id: 1, name: 1, enName: 1 },
  requested_by: { _id: 1, first_name: 1, last_name: 1 },
};

export async function getGoodsRequestRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "goods_request", act: "gets", details: { set: request.set ?? {}, get: { ...DEFAULT_PROJECTION, ...request.get } as never } }, { token: token?.value });
}
