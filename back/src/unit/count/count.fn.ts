import { type ActFn, ObjectId } from "@deps";
import { unit } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: { search, organizationId, roadId, type },
	} = body.details;

	const filters: Record<string, any> = {};

	if (search) {
		const regex = new RegExp(search as string, "i");
		filters["$or"] = [
			{ code: { $regex: regex } },
			{ name: { $regex: regex } },
		];
	}
	if (organizationId) {
		filters["organization._id"] = new ObjectId(organizationId as string);
	}
	if (roadId) filters["road._id"] = new ObjectId(roadId as string);
	if (type) filters.type = type;

	return { qty: await unit.countDocument({ filter: filters }) };
};
