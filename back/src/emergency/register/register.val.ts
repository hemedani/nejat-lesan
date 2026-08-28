import { enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";
import { selectStruct } from "../../../mod.ts";

export const registerEmergencyValidator = () => {
	return object({
		set: object({
			note: optional(string()),
			location: optional(geoJSONStruct("Point")),
			gps_accuracy: optional(number()),
			connection_status: optional(
				enums(["online", "degraded", "offline"]),
			),
		}),
		get: selectStruct("emergency", 1),
	});
};
