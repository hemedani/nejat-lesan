import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp } from "../../../mod.ts";
import { getAllowedManagerOrgIds, type MyContext, throwError } from "@lib";

export const getsFn: ActFn = async (body) => {
	const {
		set: {
			page,
			limit,
			skip,
			organizationId,
			status,
			incident_type,
			search,
		},
		get,
	} = body.details;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	const actor = context.user;

	const allowed = await getAllowedManagerOrgIds(actor);
	let effectiveOrg = organizationId as string | undefined;
	if (allowed !== null) {
		if (effectiveOrg) {
			if (!allowed.includes(effectiveOrg)) {
				return throwError("شما به این سازمان دسترسی ندارید");
			}
		} else if (allowed.length === 1) {
			effectiveOrg = allowed[0];
		} else if (allowed.length === 0) {
			return throwError("شما به سازمانی دسترسی ندارید");
		} else {
			return throwError("شناسه سازمان را مشخص کنید");
		}
	}

	const match: Record<string, any> = {};

	if (effectiveOrg) {
		match["organization._id"] = new ObjectId(effectiveOrg as string);
	}
	if (status) match.status = status;
	if (incident_type) match.incident_type = incident_type;
	if (search) {
		match.name = { $regex: new RegExp(search as string, "i") };
	}

	const pipeline: Record<string, any>[] = [];
	if (Object.keys(match).length > 0) pipeline.push({ $match: match });
	pipeline.push({ $sort: { _id: -1 } });

	const finalSkip = skip || ((limit || 50) as number) * ((page || 1) - 1);
	pipeline.push({ $skip: finalSkip });
	pipeline.push({ $limit: limit || 50 });

	const data = await accident_process
		.aggregation({
			pipeline,
			projection: get,
		})
		.toArray();

	const totalCount = await accident_process.countDocument({ filter: match });

	return { data, totalCount };
};
