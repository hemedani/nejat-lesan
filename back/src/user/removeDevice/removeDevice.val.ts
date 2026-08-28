import { object, size, string } from "@deps";

export const removeDeviceValidator = () => {
	return object({
		set: object({
			deviceId: size(string(), 8, 100),
		}),
	});
};
