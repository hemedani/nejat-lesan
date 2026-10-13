import type { ReqType } from "@/types/declarations/selectInp";

/**
 * پروجکشن‌های `road`.
 *
 * `as const satisfies` عمدی است: بدون آن، `as never` در اکشنها هر بررسیِ
 * نوعِ فیلد را خاموش می‌کند و دقیقاً همان چیزی به تولید می‌رسد که
 * `audit-projection-shapes.py` شکارش می‌کند — رابطه‌ای که با `1` پروژکت
 * شده و فقط هنگام اجرا می‌میرد.
 *
 * `area` و `lanes` عمداً هستند: فرمِ جزئیات بدون آن‌ها عملاً نیم‌کاره است.
 */
type RoadGetsGet = ReqType["main"]["road"]["gets"]["get"];
type RoadGetGet = ReqType["main"]["road"]["get"]["get"];

export const roadListProjection = {
  _id: 1,
  name: 1,
  origin: 1,
  destination: 1,
  total_length_meters: 1,
  province: { _id: 1, name: 1 },
} as const satisfies RoadGetsGet;

export const roadDetailProjection = {
  ...roadListProjection,
  area: 1,
  lanes: 1,
  createdAt: 1,
  updatedAt: 1,
  province: { _id: 1, name: 1, english_name: 1 },
  registrer: { _id: 1, first_name: 1, last_name: 1 },
} as const satisfies RoadGetGet;

export type RoadListItem = {
  _id: string;
  name: string;
  origin?: string;
  destination?: string;
  total_length_meters?: number;
  province?: { _id?: string; name?: string; english_name?: string };
};

export type RoadDetail = RoadListItem & {
  area?: { type: string; coordinates: number[][][] };
  lanes?: { _id: string; name: string }[];
  createdAt?: string;
  updatedAt?: string;
  registrer?: { _id?: string; first_name?: string; last_name?: string };
};
