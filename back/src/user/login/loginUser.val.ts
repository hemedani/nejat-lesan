import { enums, object, optional, size, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { emailPattern } from "@model";

export const loginUserValidator = () => {
	return object({
		set: object({
			email: emailPattern,
			password: size(string(), 8, 100),
			device: optional(
				object({
					device_id: size(string(), 8, 100),
					fingerprint: size(string(), 8, 100),
					platform: optional(string()),
					app_version: optional(string()),
					model: optional(string()),
					push_token: optional(string()),
				}),
			),
		}),
		get: optional(
			object({
				token: optional(enums([0, 1])),
				user: selectStruct("user", 1),
				permissions: optional(enums([0, 1])),
			}),
		),
	});
};
