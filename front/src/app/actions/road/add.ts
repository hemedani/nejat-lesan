"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { asSingleItemResponse } from "@/utils/api-response";
import { cookies } from "next/headers";
import { roadDetailProjection } from "@/services/road-projections";

/** فیلدهای pure که فرم می‌فرستد؛ `total_length_meters` نداریم چون مشتق است. */
export type RoadAddSet = ReqType["main"]["road"]["add"]["set"];

/**
 * `asSingleItemResponse` نوع را `unknown` برمی‌گرداند، ولی مصرف‌کننده باید
 * بتواند `success` را بدون cast بخواند. اینجا پوشش را از همان helper
 * برمی‌داریم و دوباره تایپ می‌کنیم.
 */
export type LesanResponse<T> = {
  success: boolean;
  body: T & { message?: string };
};

export const add = async (request: {
  set: Partial<RoadAddSet>;
  get?: Partial<ReqType["main"]["road"]["add"]["get"]>;
}): Promise<LesanResponse<unknown>> => {
  const token = (await cookies()).get("token");
  return (await AppApi().send(
    {
      service: "main",
      model: "road",
      act: "add",
      details: {
        set: request.set,
        get: { ...roadDetailProjection, ...request.get } as never,
      },
    },
    { token: token?.value },
  )) as LesanResponse<unknown>;
};

/**
 * `area` و `lanes` روی update اختیاری‌اند، پس «پاک‌کردن» یعنی فرستادنِ
 * مقدارِ خالی — نه حذفِ کلید. اگر فرم آن‌ها را از `set` بیرون بیندازد،
 * مقدارِ قبلی بی‌سروصدا می‌ماند.
 *
 * `provinceId` رابطه است و در بک‌اند از راه `addRelation` می‌رود.
 */
export type RoadUpdateSet = ReqType["main"]["road"]["update"]["set"];

export const update = async (request: {
  set: Partial<RoadUpdateSet>;
  get?: Partial<ReqType["main"]["road"]["update"]["get"]>;
}): Promise<LesanResponse<unknown>> => {
  const token = (await cookies()).get("token");
  return (asSingleItemResponse(
    await AppApi().send(
      {
        service: "main",
        model: "road",
        act: "update",
        details: {
          set: request.set,
          get: { ...roadDetailProjection, ...request.get } as never,
        },
      },
      { token: token?.value },
    ),
  )) as LesanResponse<unknown>;
};
