import {
	array,
	object,
	ObjectId,
	objectIdValidation,
	optional,
	string,
} from "@deps";
import { geoJSONStruct } from "@model";
import { multiLineLengthMeters, throwError } from "@lib";
import { position } from "../../mod.ts";

/**
 * فیلدهای pureِ مشترکِ نوشتنی بین `road.add` و `road.update`.
 *
 * `name` و `area` عمداً اینجا نیستند: در `add` اجباری‌اند و در `update`
 * اختیاری، و این تفاوت باید در validatorِ خودِ هر اکشن دیده شود نه پشت یک
 * factory پنهان.
 *
 * `total_length_meters` هم عمداً اینجا نیست: طولِ هندسه است، نه ورودیِ
 * کلاینت — `deriveTotalLength` آن را می‌سازد.
 */
export const road_writeableSet = {
	origin: optional(string()),
	destination: optional(string()),
	lanes: optional(array(object({
		_id: objectIdValidation,
		name: string(),
	}))),
};

/** `road.area` — `MultiLineString`، یعنی `coordinates` سه‌سطحی است. */
export const roadAreaStruct = geoJSONStruct("MultiLineString");

export type RoadLane = { _id: string; name: string };

/**
 * تنها جایی که `road.total_length_meters` نوشته می‌شود.
 *
 * عددِ دستیِ کلاینت پذیرفته نمی‌شود چون می‌تواند با `area` اختلاف بگیرد، و آن
 * اختلاف بی‌صدا به `road.snapPointToRoad` و گزارش کیلومتر/متر می‌رسد. روشِ
 * تخمین هم دقیقاً همان `projectPointToMultiLine` است، پس مقدارِ ذخیره‌شده و خطی
 * که رویش snap می‌شود نمی‌توانند اختلاف بگیرند.
 */
export const deriveTotalLength = (area: {
	type: string;
	coordinates: [number, number][][];
}): number => Math.round(multiLineLengthMeters(area.coordinates));

/**
 * `lanes` باید به اسنادِ واقعیِ `position` اشاره کند.
 *
 * `common_relation_struct` فقط وجود `name` را تضمین می‌کند؛ یک `_id` متروک از
 * آن رد می‌شود و جاده‌ای می‌سازد که `snapPointToRoad` دیگر آن خط را برنمی‌گرداند.
 * پس وجودش را خودمان چک می‌کنیم.
 */
export const assertLanesExist = async (lanes: RoadLane[]) => {
	const unique = [...new Set(lanes.map((lane) => lane._id))];
	if (unique.length === 0) return;

	const found = await position.find({
		filters: { _id: { $in: unique.map((id) => new ObjectId(id)) } },
		projection: { _id: 1 },
	}).toArray() as unknown as Array<{ _id: ObjectId }>;

	if (found.length !== unique.length) {
		return throwError("موقعیت‌های انتخاب‌شده معتبر نیستند");
	}
};
