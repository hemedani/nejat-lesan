import type { ActFn } from "@deps";
import { event } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	let { page, limit, skip } = body.details.set;
	const get = body.details.get;

	page = page || 1;
	limit = limit || 20;
	skip = skip || limit * (page - 1);

	return await event
		.find({
			filters: {},
			projection: get,
		})
		.skip(skip)
		.limit(limit)
		.toArray();
};
