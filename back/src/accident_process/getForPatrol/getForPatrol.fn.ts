import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp, unit } from "../../../mod.ts";
import { getRegistryModel } from "../questionRegistry.ts";
import { resolveUserOrgId } from "../helpers.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

const PROCESS_PROJECTION = {
	_id: 1,
	name: 1,
	description: 1,
	status: 1,
	version: 1,
	incident_type: 1,
	steps: 1,
};

/**
 * getForPatrol — تنها endpoiny که ویزارد موبایل برای رندر نیاز دارد:
 * فرآیند فعال سازمان مأمور (+ نوع رخداد)، و در صورت درخواست، گزینه‌های پاسخ
 * هر سؤال (فقط رکوردهای whitelist شده؛ «از ۵۰ رکورد فقط ۳ تا»).
 */
export const getForPatrolFn: ActFn = async (body) => {
	const {
		set: { incidentType, orgId: paramOrgId },
		get,
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// --- Resolve org ---
	let orgId: string | null = null;
	if (user.level === "Ghost" || user.level === "Manager") {
		if (!paramOrgId) {
			return throwError("برای مدیر، شناسه سازمان (orgId) الزامی است");
		}
		orgId = paramOrgId as string;
	} else {
		// نقش‌ها اولویت دارند
		const roles = (user.roles || []) as Array<{
			scopeType?: string;
			scopeId?: string;
		}>;
		for (const r of roles) {
			if (r.scopeType === "organization" && r.scopeId) {
				orgId = r.scopeId;
				break;
			}
		}
		if (!orgId) {
			for (const r of roles) {
				if (r.scopeType === "unit" && r.scopeId) {
					const u = await unit.findOne({
						filters: { _id: new ObjectId(r.scopeId) },
						projection: { "organization._id": 1 },
					});
					const o = (u as any)?.organization?._id as
						| ObjectId
						| undefined;
					if (o) {
						orgId = o.toString();
						break;
					}
				}
			}
		}
		if (!orgId) {
			// مأمور گشت بدون نقش سازمانی → از unit.organization (واحد گشت)
			orgId = await resolveUserOrgId(new ObjectId(user._id));
		}
		if (!orgId) {
			return throwError(
				"سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید",
			);
		}
	}

	// --- Active process for org(+type) ---
	const baseFilter: Record<string, any> = {
		"organization._id": new ObjectId(orgId),
		status: "active",
	};

	let proc: any = null;
	if (incidentType) {
		proc = await accident_process.findOne({
			filters: { ...baseFilter, incident_type: incidentType },
			projection: PROCESS_PROJECTION,
		});
	}
	// fallback: فرآیند سراسری سازمان (بدون incident_type)
	if (!proc) {
		proc = await accident_process.findOne({
			filters: { ...baseFilter, incident_type: { $exists: false } },
			projection: PROCESS_PROJECTION,
		});
	}

	const result: Record<string, unknown> = {};
	if (!proc) {
		result.process = null;
		return result;
	}

	if (get.answers === 1) {
		// عمق اول: برای هر (model, allowed) یک بار fetch و کش
		const cache = new Map<string, Array<{ _id: ObjectId; name: string }>>();
		const fetchKey = (modelName: string, allowed: string[]) =>
			`${modelName}:${allowed.join(",")}`;

		const steps = JSON.parse(JSON.stringify((proc as any).steps || []));
		for (const step of steps) {
			for (const q of step.questions || []) {
				const model = getRegistryModel(q.model_name);
				const allowed: string[] = (q.allowed_answer_ids || []).map(
					(id: any) => (id._id ? id._id.toString() : id.toString()),
				);
				const key = fetchKey(q.model_name, allowed);
				if (!cache.has(key) && model) {
					const filter = allowed.length
						? { _id: { $in: allowed.map((a) => new ObjectId(a)) } }
						: {};
					cache.set(
						key,
						await model
							.find({
								filters: filter,
								projection: { _id: 1, name: 1 },
							})
							.sort({ name: 1 })
							.limit(500)
							.toArray(),
					);
				}
				q.answers = cache.get(key) || [];
				delete q.allowed_answer_ids;
			}
		}
		proc = { ...proc, steps };
	}

	result.process = proc;
	return result;
};
