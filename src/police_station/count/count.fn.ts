import type { ActFn, Document } from "@deps";
import { police_station } from "../../../mod.ts";

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

	const foundedItemsLength = await police_station.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
