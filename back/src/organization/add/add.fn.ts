import { type ActFn, ObjectId } from "@deps";
import { coreApp, organization, road } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { roadId, headId, logoId, ...rest } = set;

	const relations: Record<string, any> = {
		registrer: {
			_ids: user._id,
		},
	};

	if (roadId) {
		const roadDoc = await road.findOne({
			filters: { _id: new ObjectId(roadId as string) },
			projection: { _id: 1 },
		});
		if (!roadDoc) return throwError("راه مورد نظر یافت نشد");
		relations.road = {
			_ids: new ObjectId(roadId as string),
			relatedRelations: { organization: true },
		};
	}

	if (headId) {
		relations.head = {
			_ids: new ObjectId(headId as string),
		};
	}
	if (logoId) {
		relations.logo = {
			_ids: new ObjectId(logoId as string),
		};
	}

	return await organization.insertOne({
		doc: rest as Record<string, any>,
		relations,
		projection: get,
	});
};
