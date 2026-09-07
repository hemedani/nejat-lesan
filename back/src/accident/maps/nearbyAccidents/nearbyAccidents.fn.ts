import { type ActFn, ObjectId } from "@deps";
import { accident, coreApp } from "../../../../mod.ts";
import { type MyContext, throwError } from "@lib";

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;

/**
 * حوادث ثبت‌شده در یک کادر جغرافیایی برای نمایش روی نقشه موبایل.
 * - Patrol: فقط با مجوز patrol_permissions.can_view_map
 * - Manager/Ghost: همیشه مجاز
 * خروجی سبک است و هیچ داده حساسی (راننده/بیمه/...) برنمی‌گرداند.
 */
export const nearbyAccidentsFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	if (actor.level === "Patrol") {
		if (!actor.patrol_permissions?.can_view_map) {
			return throwError("شما اجازه مشاهده نقشه را ندارید");
		}
	} else if (actor.level !== "Manager" && actor.level !== "Ghost") {
		return throwError("شما اجازه این کار را ندارید");
	}

	const {
		set: { minLat, maxLat, minLng, maxLng, limit },
	} = body.details;

	const finalLimit = Math.min(limit || DEFAULT_LIMIT, MAX_LIMIT);

	const docs: any[] = await accident
		.find({
			filters: {
				sync_status: "synced",
				location: {
					$geoWithin: {
						$box: [
							[minLng as number, minLat as number],
							[maxLng as number, maxLat as number],
						],
					},
				},
			},
			projection: {
				_id: 1,
				report_id: 1,
				seri: 1,
				location: 1,
				date_of_accident: 1,
				review_status: 1,
				incident_type: 1,
				type: 1,
				incident_severity: 1,
			},
		})
		.limit(finalLimit)
		.toArray();

	return {
		accidents: docs.map((doc) => ({
			_id: new ObjectId(doc._id).toString(),
			report_id: doc.report_id ?? null,
			seri: doc.seri ?? null,
			location: doc.location ?? null,
			date_of_accident: doc.date_of_accident ?? null,
			review_status: doc.review_status ?? null,
			incident_type: doc.incident_type ?? "accident",
			type_name: doc.type?.name ?? null,
			incident_severity_name: doc.incident_severity?.name ?? null,
		})),
	};
};
