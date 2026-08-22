import { enums, object, optional, size, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { personnel_code_pattern } from "@model";

export const mobileLoginValidator = () => {
	return object({
		set: object({
			personnel_code: personnel_code_pattern,
			password: size(string(), 8, 100),
			device: object({
				device_id: size(string(), 8, 100),
				fingerprint: size(string(), 8, 100),
				platform: optional(string()),
				app_version: optional(string()),
				model: optional(string()),
			}),
		}),
		get: optional(
			object({
				token: optional(enums([0, 1])),
				user: selectStruct("user", 1),
				permissions: optional(enums([0, 1])),
				devices: selectStruct("device", 1),
			}),
		),
	});
};