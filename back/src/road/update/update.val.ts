import { object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { road_writeableSet, roadAreaStruct } from "../roadSetStruct.ts";

/**
 * `road.update`
 *
 * پیش از این فقط `_id`/`name`/`area` را می‌پذیرفت، در حالی که `origin`,
 * `destination` و `lanes` در `road_pure` بودند و هرگونه فرمِ درستی آن‌ها را
 * بی‌سروصدا دور می‌ریخت. `total_length_meters` هم عمداً نیست: مشتق از
 * `area` است و `update.fn.ts` می‌سازدش.
 */
export const updateValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			name: optional(string()),
			area: optional(roadAreaStruct),
			...road_writeableSet,
			provinceId: optional(objectIdValidation),
		}),
		get: selectStruct("road", 1),
	});
};
