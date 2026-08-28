import { type ActFn, ObjectId } from "@deps";
import {
	coreApp,
	patrol_unit,
	police_station,
	user,
	vehicle,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";
import {
	assertNoUnitConflicts,
	assertOfficersAssignable,
	assertVehiclesAssignable,
} from "../../patrol_shared/guards.ts";
import { logOperation } from "../../../utils/logOperation.ts";

const toObjectIds = (ids?: string[]): ObjectId[] => {
	const unique = new Set(ids ?? []);
	return [...unique].map((id) => new ObjectId(id));
};

export const updateRelationsFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user: actor }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		_id,
		officerIds,
		removeOfficerIds,
		vehicleIds,
		removeVehicleIds,
		policeStationId,
		removePoliceStation,
	} = set;

	const unitId = new ObjectId(_id as string);
	const foundedUnit = await patrol_unit.findOne({
		filters: { _id: unitId },
		projection: {
			_id: 1,
			code: 1,
			name: 1,
			is_active: 1,
			"officers._id": 1,
			"vehicles._id": 1,
			"police_station._id": 1,
		},
	});
	if (!foundedUnit) return throwError("گشت یافت نشد");

	const addOfficerIds = toObjectIds(officerIds as string[]);
	const removeOfficers = toObjectIds(removeOfficerIds as string[]);
	const addVehicleIds = toObjectIds(vehicleIds as string[]);
	const removeVehicles = toObjectIds(removeVehicleIds as string[]);

	for (const id of addOfficerIds) {
		if (removeOfficers.some((r) => r.equals(id))) {
			throwError("یک مأمور نمی‌تواند هم‌زمان اضافه و حذف شود");
		}
	}
	for (const id of addVehicleIds) {
		if (removeVehicles.some((r) => r.equals(id))) {
			throwError("یک خودرو نمی‌تواند هم‌زمان اضافه و حذف شود");
		}
	}

	// ---------- اعتبارسنجی مأموران ----------
	if (addOfficerIds.length > 0) {
		const officers = await user.find({
			filters: { _id: { $in: addOfficerIds } },
			projection: { _id: 1, level: 1, is_active: 1 },
		}).toArray();
		if (officers.length !== addOfficerIds.length) {
			const found = new Set(officers.map((o) => o._id.toString()));
			const missing = addOfficerIds
				.filter((id) => !found.has(id.toString()))
				.map((id) => id.toString())
				.join("، ");
			throwError(`مأمور(های) زیر یافت نشدند: ${missing}`);
		}
		assertOfficersAssignable(officers);

		const conflictingUnits = await patrol_unit
			.find({
				filters: {
					_id: { $ne: unitId },
					is_active: true,
					"officers._id": { $in: addOfficerIds },
				},
				projection: { _id: 1, code: 1, name: 1, "officers._id": 1 },
			})
			.limit(1)
			.toArray();
		assertNoUnitConflicts(conflictingUnits, "officerIds");
	}

	// ---------- اعتبارسنجی خودروها ----------
	if (addVehicleIds.length > 0) {
		const vehiclesFound = await vehicle.find({
			filters: { _id: { $in: addVehicleIds } },
			projection: { _id: 1, is_active: 1 },
		}).toArray();
		if (vehiclesFound.length !== addVehicleIds.length) {
			const found = new Set(vehiclesFound.map((v) => v._id.toString()));
			const missing = addVehicleIds
				.filter((id) => !found.has(id.toString()))
				.map((id) => id.toString())
				.join("، ");
			throwError(`خودرو(های) زیر یافت نشدند: ${missing}`);
		}
		assertVehiclesAssignable(vehiclesFound);

		const conflictingUnits = await patrol_unit
			.find({
				filters: {
					_id: { $ne: unitId },
					is_active: true,
					"vehicles._id": { $in: addVehicleIds },
				},
				projection: { _id: 1, code: 1, name: 1, "vehicles._id": 1 },
			})
			.limit(1)
			.toArray();
		assertNoUnitConflicts(conflictingUnits, "vehicleIds");
	}

	// ---------- اعتبارسنجی کلانتری ----------
	let stationObjectId: ObjectId | undefined;
	if (policeStationId) {
		stationObjectId = new ObjectId(policeStationId as string);
		const foundedStation = await police_station.findOne({
			filters: { _id: stationObjectId },
			projection: { _id: 1, is_active: 1 },
		});
		if (!foundedStation) return throwError("کلانتری یافت نشد");
		if (foundedStation.is_active === false) {
			return throwError("کلانتری غیرفعال است و قابل تخصیص نیست");
		}
	}

	// ---------- اعتبارسنجی حذف‌ها (عضویت فعلی) ----------
	const embeddedOfficerIds = new Set(
		((foundedUnit.officers ?? []) as Array<{ _id: ObjectId }>).map((o) =>
			o._id.toString()
		),
	);
	if (removeOfficers.some((id) => !embeddedOfficerIds.has(id.toString()))) {
		const missing = removeOfficers
			.filter((id) => !embeddedOfficerIds.has(id.toString()))
			.map((id) => id.toString())
			.join("، ");
		throwError(`مأمور(های) زیر عضو این گشت نیستند: ${missing}`);
	}

	const embeddedVehicleIds = new Set(
		((foundedUnit.vehicles ?? []) as Array<{ _id: ObjectId }>).map((v) =>
			v._id.toString()
		),
	);
	if (removeVehicles.some((id) => !embeddedVehicleIds.has(id.toString()))) {
		const missing = removeVehicles
			.filter((id) => !embeddedVehicleIds.has(id.toString()))
			.map((id) => id.toString())
			.join("، ");
		throwError(`خودرو(های) زیر به این گشت تخصیص نیافته‌اند: ${missing}`);
	}

	if (removePoliceStation && !(foundedUnit.police_station as any)?._id) {
		throwError("این گشت در حال حاضر کلانتری ندارد");
	}

	const hasMutation = addOfficerIds.length > 0 ||
		removeOfficers.length > 0 ||
		addVehicleIds.length > 0 ||
		removeVehicles.length > 0 ||
		stationObjectId !== undefined ||
		removePoliceStation === true;

	if (!hasMutation) {
		const rows = await patrol_unit.aggregation({
			pipeline: [{ $match: { _id: unitId } }],
			projection: get,
		}).toArray();
		return rows[0];
	}

	// ---------- حذف‌ها ----------
	const removeRelations: Record<string, any> = {};
	if (removeOfficers.length > 0) {
		removeRelations.officers = {
			_ids: removeOfficers,
			relatedRelations: { patrol_unit: true },
		};
	}
	if (removeVehicles.length > 0) {
		removeRelations.vehicles = {
			_ids: removeVehicles,
			relatedRelations: { patrol_unit: true },
		};
	}
	if (removePoliceStation) {
		removeRelations.police_station = {
			_ids: ((foundedUnit.police_station as any)._id) as ObjectId,
			relatedRelations: { patrol_units: true },
		};
	}
	if (Object.keys(removeRelations).length > 0) {
		await patrol_unit.removeRelation({
			filters: { _id: unitId },
			relations: removeRelations,
		});
	}

	// ---------- افزودن‌ها ----------
	const addRelations: Record<string, any> = {};
	if (addOfficerIds.length > 0) {
		addRelations.officers = {
			_ids: addOfficerIds,
			relatedRelations: { patrol_unit: true },
		};
	}
	if (addVehicleIds.length > 0) {
		addRelations.vehicles = {
			_ids: addVehicleIds,
			relatedRelations: { patrol_unit: true },
		};
	}
	if (stationObjectId) {
		addRelations.police_station = {
			_ids: stationObjectId,
			relatedRelations: { patrol_units: true },
		};
	}
	if (Object.keys(addRelations).length > 0) {
		// اگر رابطه کلانتری قبلاً حذف شده باشد، فریمورک یک آبجکت خالی باقی می‌گذارد
		// و addRelation با گزینه replace روی این حالت خطا می‌دهد؛ فیلد خالی را پاک می‌کنیم.
		const hasEmptyStationStub = stationObjectId !== undefined &&
			(foundedUnit.police_station as any)?._id === undefined &&
			foundedUnit.police_station !== undefined;
		if (hasEmptyStationStub) {
			await patrol_unit.findOneAndUpdate({
				filter: { _id: unitId },
				update: { $unset: { police_station: "" } },
				projection: { _id: 1 },
			});
		}

		await patrol_unit.addRelation({
			filters: { _id: unitId },
			relations: addRelations,
			replace: true,
		});
	}

	await logOperation({
		actorId: actor._id,
		action: "patrol_unit.updateRelations",
		entityType: "patrol_unit",
		entityId: unitId,
		summary: `به‌روزرسانی روابط گشت «${foundedUnit.name}»`,
		changes: {
			addedOfficerIds: addOfficerIds.map(String),
			removedOfficerIds: removeOfficers.map(String),
			addedVehicleIds: addVehicleIds.map(String),
			removedVehicleIds: removeVehicles.map(String),
			policeStationId: stationObjectId?.toString(),
			removePoliceStation: removePoliceStation === true,
		},
	});

	const updated = await patrol_unit.aggregation({
		pipeline: [{ $match: { _id: unitId } }],
		projection: get,
	}).toArray();

	return updated[0];
};
