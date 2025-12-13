import type { ActFn, Document } from "@deps";
import { event } from "../../../mod.ts";

export const getsFn: ActFn = async (body) => {
	let { page, limit, skip, name } = body.details.set;
	const get = body.details.get;

	page = page || 1;
	limit = limit || 20;
	skip = skip || limit * (page - 1);

	const filters: Document = {};

	name &&
		(filters["name"] = {
			$regex: new RegExp(name, "i"),
		});

	return await event
		.find({
			filters: filters,
			projection: get,
		})
		.skip(skip)
		.limit(limit)
		.toArray();
};
