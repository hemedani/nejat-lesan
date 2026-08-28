import { type ActFn } from "@deps";
import { police_station } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { name },
	} = body.details;

	const filters: Record<string, any> = {};

	if (name) {
		filters["name"] = { $regex: new RegExp(name as string, "i") };
	}

	return { qty: await police_station.countDocument({ filter: filters }) };
};
