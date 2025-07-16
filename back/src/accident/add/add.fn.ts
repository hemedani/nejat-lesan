/**
 * -----------------------------------------------------------------------------
 * FILE: src/app/models/accident/add/add.fn.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This function handles the logic for creating a new accident record. It
 * separates the pure data from the relational IDs and uses Lesan's `insertOne`
 * to create the document and handle all relational links automatically.
 */
import { type ActFn, ObjectId, TInsertRelations } from "@deps";
import { accident, coreApp } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { accident_relations } from "@model";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// --- 1. Separate Relational IDs from the Pure Document Data ---
	const {
		provinceId,
		cityId,
		roadId,
		trafficZoneId,
		cityZoneId,
		typeId,
		positionId,
		rulingTypeId,
		lightStatusId,
		collisionTypeId,
		roadSituationId,
		roadRepairTypeId,
		shoulderStatusId,
		areaUsagesIds,
		airStatusesIds,
		roadDefectsIds,
		humanReasonsIds,
		vehicleReasonsIds,
		equipmentDamagesIds,
		roadSurfaceConditionsIds,
		attachmentsIds,
		...restOfDoc
	} = set;

	// --- 2. Build the `relations` object for Lesan ---
	const relations: TInsertRelations<typeof accident_relations> = {};

	// Handle Single Relations
	if (provinceId) {
		relations.province = {
			_ids: new ObjectId(provinceId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (cityId) {
		relations.city = {
			_ids: new ObjectId(cityId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (roadId) {
		relations.road = {
			_ids: new ObjectId(roadId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (trafficZoneId) {
		relations.traffic_zone = {
			_ids: new ObjectId(trafficZoneId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (cityZoneId) {
		relations.city_zone = {
			_ids: new ObjectId(cityZoneId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (typeId) {
		relations.type = {
			_ids: new ObjectId(typeId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (positionId) {
		relations.position = {
			_ids: new ObjectId(positionId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (rulingTypeId) {
		relations.ruling_type = {
			_ids: new ObjectId(rulingTypeId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (lightStatusId) {
		relations.light_status = {
			_ids: new ObjectId(lightStatusId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (collisionTypeId) {
		relations.collision_type = {
			_ids: new ObjectId(collisionTypeId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (roadSituationId) {
		relations.road_situation = {
			_ids: new ObjectId(roadSituationId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (roadRepairTypeId) {
		relations.road_repair_type = {
			_ids: new ObjectId(roadRepairTypeId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (shoulderStatusId) {
		relations.shoulder_status = {
			_ids: new ObjectId(shoulderStatusId as string),
			relatedRelations: { accidents: true },
		};
	}

	// Handle Multiple Relations
	if (areaUsagesIds) {
		relations.area_usages = {
			_ids: areaUsagesIds.map((id: string) => new ObjectId(id)),
			relatedRelations: { accidents: true },
		};
	}
	if (airStatusesIds) {
		relations.air_statuses = {
			_ids: airStatusesIds.map((id: string) => new ObjectId(id)),
			relatedRelations: { accidents: true },
		};
	}
	if (roadDefectsIds) {
		relations.road_defects = {
			_ids: roadDefectsIds.map((id: string) => new ObjectId(id)),
			relatedRelations: { accidents: true },
		};
	}
	if (humanReasonsIds) {
		relations.human_reasons = {
			_ids: humanReasonsIds.map((id: string) => new ObjectId(id)),
			relatedRelations: { accidents: true },
		};
	}
	if (vehicleReasonsIds) {
		relations.vehicle_reasons = {
			_ids: vehicleReasonsIds.map((id: string) => new ObjectId(id)),
			relatedRelations: { accidents: true },
		};
	}
	if (equipmentDamagesIds) {
		relations.equipment_damages = {
			_ids: equipmentDamagesIds.map((id: string) => new ObjectId(id)),
			relatedRelations: { accidents: true },
		};
	}
	if (roadSurfaceConditionsIds) {
		relations.road_surface_conditions = {
			_ids: roadSurfaceConditionsIds.map((id: string) =>
				new ObjectId(id)
			),
			relatedRelations: { accidents: true },
		};
	}
	if (attachmentsIds) {
		relations.attachments = {
			_ids: attachmentsIds.map((id: string) => new ObjectId(id)),
		}; // No reverse relation
	}

	// --- 3. Insert the Document with its Relations ---
	return await accident.insertOne({
		doc: restOfDoc,
		relations,
		projection: get,
	});
};
