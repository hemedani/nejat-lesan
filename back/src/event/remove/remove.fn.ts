import type { ActFn } from "@deps";
import { event } from "../../../mod.ts";

export const removeFn: ActFn = async (body) => {
	const {
		set: { _id, hardCascade },
	} = body.details;

	return await event.deleteOne({
		filter: { _id: _id },
		hardCascade: hardCascade || false,
	});
};
