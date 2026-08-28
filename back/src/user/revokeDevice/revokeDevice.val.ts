import { object, size, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

export const revokeDeviceValidator = () => {
	return object({
		set: object({
			deviceId: size(string(), 8, 100),
		}),
		get: selectStruct("device", 1),
	});
};
