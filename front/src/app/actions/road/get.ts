"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { asSingleItemResponse } from "@/utils/api-response";
import { cookies } from "next/headers";
import { roadDetailProjection } from "@/services/road-projections";

/**
 * یک جاده.
 *
 * `road.get` از `aggregation().toArray()` استفاده می‌کند، پس `body` یک
 * آرایهٔ **یک‌عضوی** است — وگرنه هر مصرف‌کننده‌ای با `row.name` روی
 * undefined می‌خورد. `asSingleItemResponse` همین را یک‌بار برای همیشه
 * نرمال می‌کند.
 */
export const get = async (
  _id: string,
  get?: Partial<ReqType["main"]["road"]["get"]["get"]>,
) => {
  const token = (await cookies()).get("token");
  const response = await AppApi().send(
    {
      service: "main",
      model: "road",
      act: "get",
      details: {
        set: { _id },
        get: { ...roadDetailProjection, ...get } as never,
      },
    },
    { token: token?.value },
  );
  return asSingleItemResponse(response);
};
