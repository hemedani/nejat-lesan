import { type ActFn, hash } from "@deps";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";

const DEFAULT_GHOST_PASSWORD = "password123";
const DEFAULT_GHOST_EMAIL = "ghost@nejat.ai";

export const setGhostPasswordFn: ActFn = async (body) => {
	const { get } = body.details;

	get.password = 1;

	const ghost = await user.findOne({
		filters: { level: "Ghost" },
		projection: get,
	});

	if (!ghost) {
		return throwError("No Ghost user found");
	}

	if (ghost.password) {
		return throwError("Ghost password already set");
	}

	const updateObj: Record<string, unknown> = {
		password: await hash(DEFAULT_GHOST_PASSWORD),
		updatedAt: new Date(),
	};

	if (!ghost.email) {
		updateObj.email = DEFAULT_GHOST_EMAIL;
	}

	return await user.findOneAndUpdate({
		filter: { _id: ghost._id },
		update: {
			$set: updateObj,
		},
		projection: get,
	}).then((updatedUser) => {
		if (updatedUser) {
			delete updatedUser.password;
		}
		return updatedUser;
	});
};
