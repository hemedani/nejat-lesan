import type { ActFn } from "@deps";
import { event } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const { filters } = body.details.set;

	return await event.countDocument({
		filter: filters || {},
	});
};
