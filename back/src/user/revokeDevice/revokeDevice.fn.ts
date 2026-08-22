import { type ActFn } from "@deps";
import { throwError } from "@lib";
import { device } from "../../../mod.ts";

export const revokeDeviceFn: ActFn = async (body) => {
	const {
		set: { deviceId },
		get,
	} = body.details;

	const foundedDevice = await device.findOne({
		filters: { device_id: deviceId },
		projection: { _id: 1 },
	});

	if (!foundedDevice) {
		return throwError("دستگاه یافت نشد");
	}

	return await device.findOneAndUpdate({
		filter: { _id: foundedDevice._id },
		update: {
			$set: {
				is_active: false,
				revoked_at: new Date(),
				updatedAt: new Date(),
			},
		},
		projection: get,
	});
};