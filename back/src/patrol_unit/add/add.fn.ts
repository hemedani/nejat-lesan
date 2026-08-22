import { type ActFn, ObjectId } from "@deps";
import { patrol_unit, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		policeStationId,
		vehicleIds,
		officerIds,
		...rest
	} = set;

	const relations: Record<string, any> = {
		registrer: {
			_ids: user._id,
		},
	};

	if (policeStationId) {
		relations.police_station = {
			_ids: new ObjectId(policeStationId as string),
			relatedRelations: { patrol_units: true },
		};
	}

	if (vehicleIds?.length) {
		relations.vehicles = {
			_ids: (vehicleIds as string[]).map((id) => new ObjectId(id)),
			relatedRelations: { patrol_unit: true },
		};
	}

	if (officerIds?.length) {
		relations.officers = {
			_ids: (officerIds as string[]).map((id) => new ObjectId(id)),
			relatedRelations: { patrol_unit: true },
		};
	}

	return await patrol_unit.insertOne({
		doc: rest,
		relations,
		projection: get,
	});
};