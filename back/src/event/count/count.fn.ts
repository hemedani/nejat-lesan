import type { ActFn, Document } from "@deps";
import { event } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { name },
	} = body.details;

	const filters: Document = {};

	name &&
		(filters["name"] = {
			$regex: new RegExp(name, "i"),
		});

	const foundedItemsLength = await event.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
