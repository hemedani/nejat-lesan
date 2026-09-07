import { type ActFn, ObjectId } from "@deps";
import { coreApp, organization, unit, user, vehicle } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";
import { throwError } from "@lib";

const toObjectIds = (ids?: string[]): ObjectId[] => {
	const unique = new Set(ids ?? []);
	return [...unique].map((id) => new ObjectId(id));
};

export const updateRelationsFn: ActFn = async (body) => {
	const {
		set: {
			_id,
			organizationId,
			roadId,
			parentUnitId,
			headId,
			officerIds,
			removeOfficerIds,
			vehicleIds,
			removeVehicleIds,
		},
		get,
	} = body.details;

	const unitId = new ObjectId(_id as string);

	const current = await unit.findOne({
		filters: { _id: unitId },
		projection: {
			_id: 1,
			"organization._id": 1,
			"road._id": 1,
			"officers._id": 1,
			"vehicles._id": 1,
		},
	});
	if (!current) return throwError("واحد یافت نشد");

	// ---------- گارد بین‌سازمانی ----------
	const curOrgId = (current as any).organization?._id as ObjectId | undefined;
	const effectiveOrgId = organizationId
		? new ObjectId(organizationId as string)
		: curOrgId;
	if (!effectiveOrgId) return throwError("واحد سازمان معتبری ندارد");

	const context = coreApp.contextFns.getContextModel() as MyContext;
	await assertOrgInActorScope(context.user, effectiveOrgId.toString());

	if (parentUnitId) {
		const parent = await unit.findOne({
			filters: { _id: new ObjectId(parentUnitId as string) },
			projection: { _id: 1, "organization._id": 1 },
		});
		if (!parent) return throwError("واحد والد یافت نشد");
		const parentOrgId = (parent as any).organization?._id as
			| ObjectId
			| undefined;
		if (
			!parentOrgId ||
			parentOrgId.toString() !== effectiveOrgId.toString()
		) {
			return throwError("واحد والد باید در همان سازمان باشد");
		}
	}

	// ---------- چندتایی‌ها: اعتبارسنجی وجود ----------
	const addOfficerIds = toObjectIds(officerIds as string[]);
	const removeOfficers = toObjectIds(removeOfficerIds as string[]);
	const addVehicleIds = toObjectIds(vehicleIds as string[]);
	const removeVehicles = toObjectIds(removeVehicleIds as string[]);

	if (addOfficerIds.length > 0) {
		const found = await user.find({
			filters: { _id: { $in: addOfficerIds } },
			projection: { _id: 1 },
		}).toArray();
		if (found.length !== addOfficerIds.length) {
			return throwError("یک یا چند مأمور یافت نشدند");
		}
	}
	if (addVehicleIds.length > 0) {
		const found = await vehicle.find({
			filters: { _id: { $in: addVehicleIds } },
			projection: { _id: 1 },
		}).toArray();
		if (found.length !== addVehicleIds.length) {
			return throwError("یک یا چند خودرو یافت نشدند");
		}
	}

	const embeddedOfficerIds = new Set(
		((current as any).officers || []).map((o: { _id: ObjectId }) =>
			o._id.toString()
		),
	);
	if (removeOfficers.some((id) => !embeddedOfficerIds.has(id.toString()))) {
		return throwError("مأموری که عضو این واحد نیست قابل حذف نیست");
	}
	const embeddedVehicleIds = new Set(
		((current as any).vehicles || []).map((v: { _id: ObjectId }) =>
			v._id.toString()
		),
	);
	if (removeVehicles.some((id) => !embeddedVehicleIds.has(id.toString()))) {
		return throwError("خودرویی که به این واحد تخصیص نیافته قابل حذف نیست");
	}

	// ---------- اعمال تغییرات ----------
	// حذف چندتایی‌ها
	if (removeOfficers.length > 0 || removeVehicles.length > 0) {
		const removeRelations: Record<string, any> = {};
		if (removeOfficers.length > 0) {
			removeRelations.officers = {
				_ids: removeOfficers,
				relatedRelations: { unit: true },
			};
		}
		if (removeVehicles.length > 0) {
			removeRelations.vehicles = {
				_ids: removeVehicles,
				relatedRelations: { unit: true },
			};
		}
		await unit.removeRelation({
			filters: { _id: unitId },
			relations: removeRelations,
		});
	}

	// افزودن چندتایی‌ها
	if (addOfficerIds.length > 0 || addVehicleIds.length > 0) {
		const addMultiRelations: Record<string, any> = {};
		if (addOfficerIds.length > 0) {
			addMultiRelations.officers = {
				_ids: addOfficerIds,
				relatedRelations: { unit: true },
			};
		}
		if (addVehicleIds.length > 0) {
			addMultiRelations.vehicles = {
				_ids: addVehicleIds,
				relatedRelations: { unit: true },
			};
		}
		await unit.addRelation({
			filters: { _id: unitId },
			relations: addMultiRelations,
			projection: { _id: 1 },
		});
	}

	// تک‌ها (replace: true)
	const singleRelations: Record<string, any> = {};
	if (organizationId !== undefined) {
		singleRelations.organization = {
			_ids: new ObjectId(organizationId as string),
			relatedRelations: { units: true },
		};
	}

	// همگام‌سازی راهِ denormalized واحد با راهِ سازمانِ مؤثر: هر زمان سازمان یا
	// راه در همین درخواست تغییر کند، سازمان را واکشی و راهِ واحد را هماهنگ
	// می‌کنیم (سازمانِ راه‌دار → واحدِ همان راه؛ سازمانِ بدون راه → حذف راهِ واحد).
	const orgChanged = organizationId !== undefined;
	const roadRequested = roadId !== undefined;
	if (orgChanged || roadRequested) {
		const org = await organization.findOne({
			filters: { _id: effectiveOrgId },
			projection: { _id: 1, "road._id": 1 },
		});
		if (!org) return throwError("سازمان مورد نظر یافت نشد");
		const orgRoadId = (org as any).road?._id as ObjectId | undefined;
		const curRoadId = (current as any).road?._id as ObjectId | undefined;

		if (orgRoadId) {
			const desiredRoadId = roadRequested
				? new ObjectId(roadId as string)
				: orgRoadId;
			if (desiredRoadId.toString() !== orgRoadId.toString()) {
				return throwError("راه واحد باید با راه سازمان یکسان باشد");
			}
			if (
				!curRoadId ||
				curRoadId.toString() !== desiredRoadId.toString()
			) {
				singleRelations.road = {
					_ids: [desiredRoadId],
					relatedRelations: { units: true },
				};
			}
		} else {
			if (roadRequested) {
				return throwError("سازمان راه معتبری ندارد");
			}
			if (curRoadId) {
				singleRelations.road = {
					_ids: [],
					relatedRelations: { units: true },
				};
			}
		}
	}

	if (parentUnitId !== undefined) {
		singleRelations.parentUnit = {
			_ids: new ObjectId(parentUnitId as string),
			relatedRelations: { subUnits: true },
		};
	}
	if (headId !== undefined) {
		singleRelations.head = {
			_ids: new ObjectId(headId as string),
			relatedRelations: { headedUnits: true },
		};
	}
	if (Object.keys(singleRelations).length > 0) {
		await unit.addRelation({
			filters: { _id: unitId },
			relations: singleRelations,
			replace: true,
			projection: { _id: 1 },
		});
	}

	return await unit.findOne({
		filters: { _id: unitId },
		projection: get,
	});
};
