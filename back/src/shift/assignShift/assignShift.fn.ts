import { type ActFn, ObjectId } from "@deps";
import { coreApp, patrol_unit, shift, user, vehicle } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const assignShiftFn: ActFn = async (body) => {
	const {
		set: { officerId, patrolUnitId, vehicleId, shiftType, note },
		get,
	} = body.details;
	const { user: actor }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const foundedOfficer = await user.findOne({
		filters: { _id: new ObjectId(officerId as string) },
		projection: { _id: 1, level: 1, first_name: 1, last_name: 1 },
	});
	if (!foundedOfficer) {
		return throwError("مأمور یافت نشد");
	}

	const activeShift = await shift.findOne({
		filters: { "officer._id": new ObjectId(officerId as string), status: "active" },
		projection: { _id: 1 },
	});
	if (activeShift) {
		return throwError("این مأمور در حال حاضر یک شیفت فعال دارد");
	}

	const foundedUnit = await patrol_unit.findOne({
		filters: { _id: new ObjectId(patrolUnitId as string) },
		projection: { _id: 1, is_active: 1 },
	});
	if (!foundedUnit) {
		return throwError("گشت یافت نشد");
	}

	let foundedVehicle: { _id: unknown } | null = null;
	if (vehicleId) {
		foundedVehicle = await vehicle.findOne({
			filters: { _id: new ObjectId(vehicleId as string) },
			projection: { _id: 1 },
		});
		if (!foundedVehicle) {
			return throwError("خودرو یافت نشد");
		}
	}

	const relations: Record<string, any> = {
		officer: {
			_ids: new ObjectId(officerId as string),
			relatedRelations: { shifts: true },
		},
		patrol_unit: {
			_ids: new ObjectId(patrolUnitId as string),
			relatedRelations: { shifts: true },
		},
		registrer: {
			_ids: actor._id,
		},
	};

	if (foundedVehicle) {
		relations.vehicle = {
			_ids: new ObjectId(vehicleId as string),
			relatedRelations: { shifts: true },
		};
	}

	const newShift = await shift.insertOne({
		doc: {
			shift_type: shiftType,
			status: "active",
			start_at: new Date(),
			note,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations,
		projection: get,
	});

	return newShift;
};