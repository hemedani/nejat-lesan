import type { ActFn, Document } from "@deps";
import { road } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { name },
		get,
	} = body.details;

	const filters: Document = {};

	name &&
		(filters["name"] = {
			$regex: new RegExp(name, "i"),
		});

	const foundedItemsLength = await road.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
