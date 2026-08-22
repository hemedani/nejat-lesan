import { type ActFn, ObjectId } from "@deps";
import { coreApp, patrol_unit, police_station, shift } from "../../../mod.ts";
import { throwError, type MyContext } from "@lib";

export const validatePointInZoneFn: ActFn = async (body) => {
	const {
		set: { point, userId },
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// --- 1. Resolve the officer whose patrol zone is checked ---
	let officerId: unknown = user._id;
	if (user.level === "Manager" || user.level === "Ghost") {
		if (userId) officerId = new ObjectId(userId as string);
	} else if (user.level !== "Patrol") {
		throwError("شما اجازه این عملیات را ندارید");
	}

	// --- 2. Active shift → patrol unit ---
	const activeShift = await shift.findOne({
		filters: {
			"officer._id": officerId,
			status: "active",
		},
		projection: { "patrol_unit._id": 1 },
	});

	if (!activeShift) throwError("شیفت فعالی برای این مأمور یافت نشد");

	const patrolUnitId = (activeShift as { patrol_unit?: { _id?: unknown } })
		.patrol_unit?._id;
	if (!patrolUnitId) {
		return {
			inZone: false,
			reason: "گشت فعالی برای این مأمور تعیین نشده است",
			policeStation: null,
		};
	}

	// --- 3. Patrol unit → police station (embedded single relation) ---
	const pu = await patrol_unit.findOne({
		filters: { _id: new ObjectId(patrolUnitId as string) },
		projection: {
			"police_station._id": 1,
			"police_station.name": 1,
			"police_station.area": 1,
		},
	});

	const ps = (pu as {
		police_station?: { _id?: unknown; name?: string; area?: unknown };
	}).police_station;

	if (!ps?._id || !ps.area) {
		return {
			inZone: false,
			reason: "یگان پلیس یا محدوده آن برای این مأمور تعیین نشده است",
			policeStation: null,
		};
	}

	// --- 4. Point-in-polygon check against the police station boundary ---
	const inside = await police_station.findOne({
		filters: {
			_id: new ObjectId(ps._id as string),
			area: { $geoIntersects: { $geometry: point } },
		},
		projection: { _id: 1 },
	});

	return {
		inZone: !!inside,
		policeStation: { _id: ps._id, name: ps.name },
	};
};