import { type ActFn, hash, ObjectId } from "@deps";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";

export const changeUserPasswordFn: ActFn = async (body) => {
	const {
		set: { userId, newPassword },
		get,
	} = body.details;

	const foundedUser = await user.findOne({
		filters: { _id: new ObjectId(userId) },
		projection: { _id: 1 },
	});

	if (!foundedUser) {
		return throwError("User not found");
	}

	return await user.findOneAndUpdate({
		filter: { _id: new ObjectId(userId) },
		update: {
			$set: {
				password: await hash(newPassword),
				updatedAt: new Date(),
			},
		},
		projection: get,
	});
};
