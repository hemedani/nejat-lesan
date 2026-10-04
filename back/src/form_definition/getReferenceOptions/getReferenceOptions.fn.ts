import { type ActFn, ObjectId } from "@deps";
import * as models from "../../../mod.ts";
import { coreApp } from "../../../mod.ts";
import { throwError } from "@lib";
import { getReferenceModel, REFERENCE_MODEL_NAMES } from "../helpers.ts";

const MAX_LIMIT = 500;

export const getReferenceOptionsFn: ActFn = async (body) => {
	const { set } = body.details;
	const { model, ids, search, limit } = set;

	// Allow-list: this act reads a caller-named model, so it must not become a
	// way to enumerate arbitrary collections.
	if (!(REFERENCE_MODEL_NAMES as readonly string[]).includes(model)) {
		return throwError(`مدل «${model}» برای گزینه‌های فرم معتبر نیست.`);
	}

	const target = getReferenceModel(models, model);
	if (!target) return throwError(`مدل «${model}» در دسترس نیست.`);

	const filters: Record<string, unknown> = {};
	if (Array.isArray(ids) && ids.length > 0) {
		filters._id = { $in: ids.map((id) => new ObjectId(id as string)) };
	}
	if (search) filters.name = { $regex: String(search), $options: "i" };

	const rows = await target
		.find({ filters, projection: { _id: 1, name: 1 } })
		.sort({ name: 1 })
		.limit(Math.min(Number(limit) || MAX_LIMIT, MAX_LIMIT))
		.toArray();

	return {
		model,
		items: (rows as Array<{ _id: ObjectId; name: string }>).map((row) => ({
			_id: row._id.toString(),
			name: row.name,
		})),
	};
};
