import { type ActFn } from "@deps";
import { device } from "../../../mod.ts";

export const removeDeviceFn: ActFn = async (body) => {
	const {
		set: { deviceId },
	} = body.details;

	return await device.deleteOne({
		filter: { device_id: deviceId },
		hardCascade: false,
	});
};
