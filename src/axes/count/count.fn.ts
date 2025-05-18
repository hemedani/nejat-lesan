import type { ActFn, Document } from "@deps";
import { axes } from "../../../mod.ts";

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

	const foundedItemsLength = await axes.countDocument({
		filter: filters,
	});

	return { qty: foundedItemsLength };
};
