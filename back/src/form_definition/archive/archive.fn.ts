import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext, throwError } from "@lib";

/**
 * Retire a live definition without deleting it.
 *
 * Officers may be holding a draft built against the current version, so an active
 * definition is never deleted or edited in place — it is archived and superseded
 * by activating the next one.
 *
 * The last active accident definition cannot be archived. A partial unique index
 * makes at most one exist per organization, and an organization with no accident
 * form would fall back to the app's bundled default — which is a safety net, not
 * something to be left in by accident. Replacing it goes through `activate`, which
 * archives the old one in the same step.
 */
export const archiveFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { _id } = set;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const record = await form_definition.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: {
			_id: 1,
			status: 1,
			form_kind: 1,
			"organization._id": 1,
		},
	});
	if (!record) return throwError("فرم یافت نشد");

	const form = record as unknown as {
		status: string;
		form_kind?: string;
		organization?: { _id?: ObjectId };
	};

	const orgId = form.organization?._id;
	if (!orgId) return throwError("فرم سازمان معتبری ندارد");
	await assertOrgInActorScope(user, orgId.toString());

	if (form.status !== "active") {
		return throwError("فقط فرم فعال را می‌توان غیرفعال کرد");
	}

	const kind = form.form_kind ?? "accident";
	if (kind === "accident") {
		const otherActive = await form_definition.findOne({
			filters: {
				"organization._id": orgId,
				_id: { $ne: new ObjectId(_id as string) },
				status: "active",
				form_kind: { $in: ["accident", null] },
			},
			projection: { _id: 1 },
		});
		if (!otherActive) {
			return throwError(
				"تنها فرم فعال تصادف این سازمان است و نمی‌توان آن را غیرفعال کرد؛ ابتدا فرم تصادف دیگری را فعال کنید.",
			);
		}
	}

	const now = new Date();
	return await form_definition.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string), status: "active" },
		update: { $set: { status: "archived", updatedAt: now } },
		projection: get,
	});
};
