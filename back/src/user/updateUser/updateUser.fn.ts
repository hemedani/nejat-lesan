import { type ActFn, Infer, object, ObjectId } from "@deps";
import { user } from "../../../mod.ts";
import { user_pure } from "../../../models/user.ts";

export const updateUserFn: ActFn = async (body) => {
	// const {
	// 	user,
	// }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

	const {
		set: {
			_id,
			first_name,
			last_name,
			father_name,
			gender,
			birth_date,
			summary,

			address,
		},
		get,
	} = body.details;

	const pureStruct = object(user_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
		...(first_name && { first_name }),
		...(last_name && { last_name }),
		...(father_name && { father_name }),
		...(gender && { gender }),
		...(birth_date && { birth_date }),
		...(summary && { summary }),
		...(address && { address }),
	};

	return await user.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: updateObj,
		},
		projection: get,
	});
};
