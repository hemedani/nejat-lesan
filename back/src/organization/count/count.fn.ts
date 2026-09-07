import { type ActFn } from "@deps";
import { organization } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { search },
	} = body.details;

	const filters: Record<string, any> = {};

	if (search) {
		const regex = new RegExp(search as string, "i");
		filters["$or"] = [
			{ code: { $regex: regex } },
			{ name: { $regex: regex } },
			{ enName: { $regex: regex } },
		];
	}

	return { qty: await organization.countDocument({ filter: filters }) };
};
