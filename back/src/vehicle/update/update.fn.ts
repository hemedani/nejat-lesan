import { type ActFn, ObjectId } from "@deps";
import { vehicle } from "../../../mod.ts";
import { throwError } from "@lib";

export const updateVehicleFn: ActFn = async (body) => {
	const {
		set: { _id, plaque_no, title, is_active },
		get,
	} = body.details;

	const updateObj: Record<string, any> = {
		updatedAt: new Date(),
	};

	if (plaque_no) {
		if (!Array.isArray(plaque_no) || plaque_no.length !== 3) {
			return throwError("پلاک باید از سه بخش تشکیل شود");
		}
		updateObj.plaque_no = plaque_no;
	}
	title && (updateObj.title = title);
	is_active !== undefined && (updateObj.is_active = is_active);

	const updated = await vehicle.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: get,
	});

	if (!updated) return throwError("خودرو یافت نشد");
	return updated;
};
