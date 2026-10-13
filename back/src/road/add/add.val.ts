import { object, objectIdValidation, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { road_writeableSet, roadAreaStruct } from "../roadSetStruct.ts";

/**
 * `road.add`
 *
 * `total_length_meters` را نمی‌پذیرد، برخلاف `...road_pure`. اگر پخش می‌شد،
 * آن فیلد با `optional` می‌آمد و کلاینت می‌توانست عددی دستی بفرستد که با
 * `area` نمی‌خواند — و همین بی‌صدا به `snapPointToRoad` می‌رسد. طول را
 * `add.fn.ts` از هندسه می‌سازد.
 */
export const addValidator = () => {
	return object({
		set: object({
			name: string(),
			area: roadAreaStruct,
			...road_writeableSet,
			provinceId: objectIdValidation,
		}),
		get: selectStruct("road", 1),
	});
};
