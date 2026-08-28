import { type ActFn, ObjectId } from "@deps";
import { vehicle } from "../../../mod.ts";

export const addVehicleFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const {
		colorId,
		plaqueTypeId,
		systemTypeId,
		...rest
	} = set;

	const relations: Record<string, any> = {};

	if (colorId) {
		relations.color = {
			_ids: new ObjectId(colorId as string),
		};
	}
	if (plaqueTypeId) {
		relations.plaque_type = {
			_ids: new ObjectId(plaqueTypeId as string),
		};
	}
	if (systemTypeId) {
		relations.system_type = {
			_ids: new ObjectId(systemTypeId as string),
		};
	}

	return await vehicle.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};
