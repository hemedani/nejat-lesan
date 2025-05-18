import type { ActFn } from "@deps";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";

export const tempUserFn: ActFn = async (body) => {
	const {
		set: { first_name, last_name, father_name, mobile, national_number },
		get,
	} = body.details;

	const foundedUser = await user.find({ filters: {} }).limit(1).toArray();

	if (foundedUser.length > 0) {
		return throwError("Can not do this Action!!");
	}

	return await user.insertOne({
		doc: {
			first_name,
			last_name,
			father_name,
			national_number,
			mobile,
			address: "همدان - اعتمادیه",
			gender: "Male",
			birth_date: new Date(),
			level: "Ghost",
			is_verified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {},
		projection: get,
	});
};
