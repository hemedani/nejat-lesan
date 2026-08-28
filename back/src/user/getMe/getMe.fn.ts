import { type ActFn, ObjectId } from "@deps";
import { coreApp, device, shift, user } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

export const getMeFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const _id = context.user._id;

	const { set, get } = body.details;

	// Get user with patrol_permissions
	const foundedUser = await user
		.aggregation({
			pipeline: [{ $match: { _id: new ObjectId(_id) } }],
			projection: get,
		})
		.toArray();
	foundedUser.length < 1 && throwError("user not exist");

	const userData = foundedUser[0];

	// Get active shift for the officer (if Patrol)
	let activeShift = null;
	if (userData.level === "Patrol") {
		const shiftResult = await shift.findOne({
			filters: {
				"officer._id": new ObjectId(_id),
				status: "active",
			},
			projection: {
				_id: 1,
				shift_type: 1,
				status: 1,
				start_at: 1,
				end_at: 1,
				note: 1,
				patrol_unit: 1,
				vehicle: 1,
			},
		});
		activeShift = shiftResult;
	}

	// Get active devices count
	const activeDevicesCount = await device.countDocument({
		filter: {
			"owner._id": new ObjectId(_id),
			is_active: true,
		},
	});

	return {
		...userData,
		activeShift,
		activeDevicesCount,
	};
};
