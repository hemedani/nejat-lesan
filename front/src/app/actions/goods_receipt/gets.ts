"use server";
import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";
type Act = ReqType["main"]["goods_receipt"]["gets"];

/**
 * `goods_receipt.gets` passes `get` straight to a Mongo aggregation, and an empty
 * projection is rejected with HTTP 501
 * ("Invalid $project :: projection specification must have at least one field").
 * Never default to `{}`.
 *
 * Note: `goods_receipt` has no `ware` relation — the ware identity lives in the
 * embedded `items[]` array, so the ledger view reads `items[].ware_name`.
 */
const DEFAULT_PROJECTION = {
  _id: 1,
  receipt_number: 1,
  received_at: 1,
  status: 1,
  notes: 1,
  items: 1,
  cross_dock: 1,
  createdAt: 1,
  receiving_unit: { _id: 1, name: 1 },
  target_unit: { _id: 1, name: 1 },
  received_by: { _id: 1, first_name: 1, last_name: 1 },
};

export async function getGoodsReceiptRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "goods_receipt", act: "gets", details: { set: request.set ?? {}, get: { ...DEFAULT_PROJECTION, ...request.get } as never } }, { token: token?.value });
}
