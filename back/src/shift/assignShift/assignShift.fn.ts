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
		projection: { _id: 1, level: 1, is_active: 1 },
	});
	if (!foundedOfficer) {
		return throwError("مأمور یافت نشد");
	}
	if (foundedOfficer.level !== "Patrol") {
		return throwError("شیفت فقط به مأمور با سطح «Patrol» قابل تخصیص است");
	}
	if (foundedOfficer.is_active === false) {
		return throwError("مأمور غیرفعال است و نمی‌توان شیفت به او تخصیص داد");
	}

	const activeShift = await shift.findOne({
		filters: {
			"officer._id": new ObjectId(officerId as string),
			status: "active",
		},
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
	if (foundedUnit.is_active === false) {
		return throwError("گشت غیرفعال است و نمی‌توان شیفت برای آن تعریف کرد");
	}

	let foundedVehicle: { _id: unknown } | null = null;
	if (vehicleId) {
		foundedVehicle = await vehicle.findOne({
			filters: { _id: new ObjectId(vehicleId as string) },
			projection: { _id: 1, is_active: 1 },
		});
		if (!foundedVehicle) {
			return throwError("خودرو یافت نشد");
		}
		if ((foundedVehicle as any).is_active === false) {
			return throwError("خودرو غیرفعال است و قابل تخصیص نیست");
		}

		const vehicleActiveShift = await shift.findOne({
			filters: {
				"vehicle._id": new ObjectId(vehicleId as string),
				status: "active",
			},
			projection: { _id: 1 },
		});
		if (vehicleActiveShift) {
			return throwError(
				"این خودرو در حال حاضر در یک شیفت فعال استفاده می‌شود",
			);
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
