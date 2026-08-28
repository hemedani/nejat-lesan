import { array, boolean, object, objectIdValidation, optional } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const updateRelationsValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			// تخصیص (افزودن) افسران — فقط سطح Patrol
			officerIds: optional(array(objectIdValidation)),
			// حذف افسران از گشت
			removeOfficerIds: optional(array(objectIdValidation)),
			// تخصیص (افزودن) خودروها — باید فعال باشند
			vehicleIds: optional(array(objectIdValidation)),
			// حذف خودروها از گشت
			removeVehicleIds: optional(array(objectIdValidation)),
			// تعیین/جابه‌جایی کلانتری (رابطه single)
			policeStationId: optional(objectIdValidation),
			// حذف کلانتری فعلی
			removePoliceStation: optional(boolean()),
		}),
		get: selectStruct("patrol_unit", 2),
	});
};
