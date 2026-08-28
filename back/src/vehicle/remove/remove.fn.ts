import { type ActFn, ObjectId } from "@deps";
import { patrol_unit, shift, vehicle } from "../../../mod.ts";
import { throwError } from "@lib";

export const removeVehicleFn: ActFn = async (body) => {
	const {
		set: { _id },
	} = body.details;

	const vehicleId = new ObjectId(_id as string);

	const founded = await vehicle.findOne({
		filters: { _id: vehicleId },
		projection: { _id: 1 },
	});
	if (!founded) return throwError("خودرو یافت نشد");

	const activeShiftCount = await shift.countDocument({
		filter: {
			"vehicle._id": vehicleId,
			status: "active",
		},
	});
	if (activeShiftCount > 0) {
		return throwError(
			"این خودرو در حال حاضر در یک شیفت فعال استفاده می‌شود و قابل حذف نیست",
		);
	}

	// اگر خودرو به گشتی تخصیص یافته، ابتدا و در دو جهت آن را جدا می‌کنیم.
	const assignedUnit = await patrol_unit.findOne({
		filters: { "vehicles._id": vehicleId },
		projection: { _id: 1 },
	});
	if (assignedUnit) {
		await patrol_unit.removeRelation({
			filters: { _id: assignedUnit._id },
			relations: {
				vehicles: {
					_ids: [vehicleId],
					relatedRelations: { patrol_unit: true },
				},
			},
		});
	}

	try {
		return await vehicle.deleteOne({
			filter: { _id: vehicleId },
		});
	} catch {
		return throwError(
			"این خودرو در سوابق عملیاتی (شیفت‌های پیشین) ثبت شده است و قابل حذف نیست",
		);
	}
};
