import { type ActFn } from "@deps";
import { ware } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { search, ware_type },
	} = body.details;

	const filters: Record<string, any> = {};

	if (search) {
		const regex = new RegExp(search as string, "i");
		filters["$or"] = [
			{ name: { $regex: regex } },
			{ enName: { $regex: regex } },
			{ brand: { $regex: regex } },
		];
	}
	if (ware_type) filters.ware_type = ware_type;

	return { qty: await ware.countDocument({ filter: filters }) };
};
