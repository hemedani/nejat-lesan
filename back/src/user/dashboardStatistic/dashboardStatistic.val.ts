import { enums, object, optional } from "@deps";

export const dashboardStatisticValidator = () => {
	return object({
		set: object({}), // This section remains as per your original snippet
		get: object({
			// Existing fields
			users: optional(enums([0, 1])),
			provinces: optional(enums([0, 1])),
			cities: optional(enums([0, 1])),

			// Added fields based on the previous function's return object
			accidents: optional(enums([0, 1])),
			airStatuses: optional(enums([0, 1])),
			areaUsages: optional(enums([0, 1])),
			bodyInsuranceCos: optional(enums([0, 1])),
			collisionTypes: optional(enums([0, 1])),
			colors: optional(enums([0, 1])),
			equipmentDamages: optional(enums([0, 1])),
			faultStatuses: optional(enums([0, 1])),
			humanReasons: optional(enums([0, 1])),
			insuranceCos: optional(enums([0, 1])),
			licenceTypes: optional(enums([0, 1])),
			lightStatuses: optional(enums([0, 1])),
			maxDamageSections: optional(enums([0, 1])),
			motionDirections: optional(enums([0, 1])),
			plaqueTypes: optional(enums([0, 1])),
			plaqueUsages: optional(enums([0, 1])),
			positions: optional(enums([0, 1])),
			roads: optional(enums([0, 1])),
			roadDefects: optional(enums([0, 1])),
			roadRepairTypes: optional(enums([0, 1])),
			roadSituations: optional(enums([0, 1])),
			roadSurfaceConditions: optional(enums([0, 1])),
			rulingTypes: optional(enums([0, 1])),
			shoulderStatuses: optional(enums([0, 1])),
			systems: optional(enums([0, 1])),
			systemTypes: optional(enums([0, 1])),
			types: optional(enums([0, 1])),
			vehicleReasons: optional(enums([0, 1])),
		}),
	});
};
