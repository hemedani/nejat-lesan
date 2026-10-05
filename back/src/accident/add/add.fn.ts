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
import { throwError } from "@lib";
import { resolveFilingOrgId } from "../reportScope.ts";

export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// --- 0. Sync-status claim and officer attribution --------------------------
	// A client may *assert* `draft` or `queued` — those are its own queue states —
	// but never a state only the server can witness. What the server actually
	// records for an app submission is decided in 1d below, where the arrival is.
	if (user.level === "Patrol") {
		const requestedStatus = set.sync_status || "queued";
		if (!["draft", "queued"].includes(requestedStatus)) {
			throwError(
				"مأمور گشت تنها می‌تواند گزارش با وضعیت draft یا queued ثبت کند",
			);
		}
		// Officer attribution is server-enforced for Patrol: they may only
		// create reports under their own id (never another officer's).
		if (set.officerId && set.officerId !== user._id.toString()) {
			throwError("مأمور گشت نمی‌تواند گزارش را به مأمور دیگری نسبت دهد");
		}
		set.officerId = user._id.toString();
	}

	// --- 0b. Incident type default + per-type validation ---
	// Legacy/docs without incident_type are accidents.
	const incidentType = set.incident_type || "accident";

	if (incidentType !== "accident") {
		// No field is hard-required: each organization designs its own
		// registration process (accident_process) and decides which fields its
		// officers must record. The server only guards type purity below.
		const forbidden: string[] = [];
		if (set.vehicle_dtos) forbidden.push("مشخصات خودروها");
		if (set.pedestrian_dtos) forbidden.push("عابران پیاده");
		if (set.people_dtos) forbidden.push("افراد");
		if (set.facility_damage_dtos) forbidden.push("خسارت تجهیزات");
		if (set.collisionTypeId) forbidden.push("نوع برخورد");
		if (set.typeId) forbidden.push("نوع تصادف");
		if (forbidden.length > 0) {
			throwError(
				`فیلدهای اختصاصی تصادف برای این نوع رخداد مجاز نیستند: ${
					forbidden.join("، ")
				}`,
			);
		}
	}

	// --- 1. Separate Relational IDs from the Pure Document Data ---
	const {
		officerId,
		patrolUnitId,
		vehicleId,
		laneId,
		policeStationId,
		croquisTypeId,
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
		incidentSeverityId,
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
		client_report_uuid,
		...restOfDoc
	} = set;

	// --- Extract image ObjectIds for attachment linking from restOfDoc ---
	const attachmentIds: string[] = [];
	if (restOfDoc.plate_image) {
		attachmentIds.push(restOfDoc.plate_image as string);
	}
	if (restOfDoc.insurance_image) {
		attachmentIds.push(restOfDoc.insurance_image as string);
	}
	if (restOfDoc.vehicle_dtos && Array.isArray(restOfDoc.vehicle_dtos)) {
		for (const vehicle of restOfDoc.vehicle_dtos) {
			if (vehicle.plate_image) {
				attachmentIds.push(vehicle.plate_image as string);
			}
			if (vehicle.insurance_image) {
				attachmentIds.push(vehicle.insurance_image as string);
			}
		}
	}
	if (
		restOfDoc.facility_damage_dtos &&
		Array.isArray(restOfDoc.facility_damage_dtos)
	) {
		for (const facility of restOfDoc.facility_damage_dtos) {
			if (facility.images && Array.isArray(facility.images)) {
				for (const img of facility.images) {
					attachmentIds.push(img as string);
				}
			}
		}
	}
	// Deduplicate
	const uniqueAttachmentIds = [...new Set(attachmentIds)];

	// --- 1b. Idempotency by client_report_uuid ---
	// If the app already synced this report, return the existing record
	// instead of inserting a duplicate. Also avoids the dangling reverse
	// relation Lesan leaves behind on a failed duplicate-key insert.
	if (client_report_uuid) {
		const existing = await accident.findOne({
			filters: { client_report_uuid },
			projection: get,
		});
		if (existing) return existing;
	}

	// --- 1c. Auto-generate serial + report_id when not provided ---
	const doc = { ...restOfDoc };
	// insertOne does not apply `defaulted` defaults — set incident_type explicitly.
	doc.incident_type = incidentType;
	if (client_report_uuid) doc.client_report_uuid = client_report_uuid;
	if (doc.serial === undefined) {
		const [maxDoc] = await accident
			.aggregation({
				pipeline: [{ $sort: { serial: -1 } }, { $limit: 1 }],
				projection: { serial: 1 },
			})
			.toArray();
		doc.serial = ((maxDoc?.serial as number) ?? 0) + 1;
	}
	if (!doc.report_id) {
		const year = new Date().getFullYear();
		const prefix = incidentType === "road_breakdown" ? "BRK"
			: incidentType === "road_obstacle" ? "OBS"
			: incidentType === "other" ? "OTH"
			: "REP";
		doc.report_id = `${prefix}-${year}-${String(doc.serial).padStart(6, "0")}`;
	}
	// --- 1d. The arrival *is* the sync ---------------------------------------
	// A report carrying a `client_report_uuid` was filed by the app, and this
	// request is its arrival: the document cannot exist on the server before it
	// arrives, so a record that exists has — by definition — synced. Recording it
	// as `queued` here would state a fact about the *device's* local queue on a
	// document only the server owns, and `queued` is exactly the state the review
	// gate refuses (`oversight/reviewTransition.ts`), so every app report would be
	// born unreviewable with nothing able to promote it: a Patrol may only write
	// `draft|queued`, and the console has no sync action at all.
	//
	// `synced_at` is stamped here, once, because this is the only moment the server
	// observes the arrival — which is what the per-officer "median sync time"
	// measures (`oversight/stats.ts`: `synced_at - reported_at`). A row typed in at
	// the control centre carries no uuid and so never claims an arrival it did not
	// observe.
	if (client_report_uuid) {
		doc.sync_status = "synced";
		doc.synced_at = new Date();
	}
	if (client_report_uuid && doc.review_status === undefined) {
		doc.review_status = "submitted";
	}

	// --- 2. Build the `relations` object for Lesan ---
	const relations: TInsertRelations<typeof accident_relations> = {};

	// Handle Mobile Patrol Single Relations
	if (officerId) {
		relations.officer = {
			_ids: new ObjectId(officerId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (patrolUnitId) {
		relations.patrol_unit = {
			_ids: new ObjectId(patrolUnitId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (vehicleId) {
		relations.vehicle = {
			_ids: new ObjectId(vehicleId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (laneId) {
		relations.lane = {
			_ids: new ObjectId(laneId as string),
		};
	}
	if (policeStationId) {
		relations.police_station = {
			_ids: new ObjectId(policeStationId as string),
			relatedRelations: { accidents: true },
		};
	}
	if (croquisTypeId) {
		relations.croquis_type = {
			_ids: new ObjectId(croquisTypeId as string),
			relatedRelations: { accidents: true },
		};
	}

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
	if (incidentSeverityId) {
		relations.incident_severity = {
			_ids: new ObjectId(incidentSeverityId as string),
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

	// Add extracted attachment IDs from image fields
	if (uniqueAttachmentIds.length > 0) {
		const existingIds =
			(relations.attachments?._ids as ObjectId[] | undefined)?.map((
				id: ObjectId,
			) => id.toString()) || [];
		const allIds = [...new Set([...existingIds, ...uniqueAttachmentIds])];
		relations.attachments = {
			_ids: allIds.map((id: string) => new ObjectId(id)),
		};
	}

	// --- 3. Provenance: link the filing organization, for app submissions ------
	// `submitted_from` is the app declaring which build filed the report, so its
	// presence is the signal that this is an app submission. The organization is
	// then resolved from the session — never from the request — mirroring
	// `incident_report/add/add.fn.ts` so both models attribute identically.
	if (doc.submitted_from) {
		const roadRelation = relations.road as
			| { _ids?: ObjectId }
			| undefined;
		const filingOrgId = await resolveFilingOrgId(
			user as unknown as Parameters<typeof resolveFilingOrgId>[0],
			roadRelation?._ids?.toString() ?? null,
		);
		if (filingOrgId) {
			relations.organization = {
				_ids: filingOrgId,
				relatedRelations: {},
			};
		}
		// Unresolvable organization is not an error: the report is still filed and
		// the console groups it under "unlinked".
	}

	// --- 4. Insert the Document with its Relations ---
	return await accident.insertOne({
		doc,
		relations,
		projection: get,
	});
};
