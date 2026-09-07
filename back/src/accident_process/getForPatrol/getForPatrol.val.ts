import { enums, object, objectIdValidation, optional } from "@deps";
import { process_incident_type_emums } from "@model";

export const getForPatrolValidator = () => {
	return object({
		set: object({
			// نوع رخداد (تصادف / خرابی / ...) — خالی = فرآیند سراسری سازمان
			incidentType: optional(process_incident_type_emums),
			// Manager/Ghost فقط
			orgId: optional(objectIdValidation),
		}),
		get: object({
			process: optional(enums([0, 1])),
			answers: optional(enums([0, 1])),
		}),
	});
};
