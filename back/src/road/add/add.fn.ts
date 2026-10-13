import { type ActFn, ObjectId } from "@deps";
import { coreApp, road } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertLanesExist, deriveTotalLength } from "../roadSetStruct.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { provinceId, lanes, ...rest } = set;

	if (lanes) {
		await assertLanesExist(
			lanes as unknown as { _id: string; name: string }[],
		);
	}

	return await road.insertOne({
		doc: {
			...rest,
			...(lanes ? { lanes } : {}),
			// طول از هندسه می‌آید، نه از کلاینت. `add.val.ts` هم آن را
			// نمی‌پذیرد؛ این تنها جایی است که نوشته می‌شود.
			total_length_meters: deriveTotalLength(set.area as never),
		},
		relations: {
			registrer: {
				_ids: user._id,
			},
			province: {
				_ids: new ObjectId(provinceId as string),
				relatedRelations: {
					roads: true,
				},
			},
		},
		projection: get,
	});
};
