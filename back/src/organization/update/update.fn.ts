import { type ActFn, ObjectId } from "@deps";
import { coreApp, organization } from "../../../mod.ts";
import { assertOrgInActorScope, type MyContext } from "@lib";

export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, headId, logoId, ...rest },
		get,
	} = body.details;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	await assertOrgInActorScope(context.user, _id as string);

	const updateObj: Record<string, any> = { updatedAt: new Date() };

	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) updateObj[key] = value;
	}

	await organization.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: { _id: 1 },
	});

	// رابطه‌ی تکی: مقدار باید یک ObjectId تنها باشد، نه آرایه.
	// `handleSingleRelation` با `{_id: _ids}` فیلتر می‌کند، پس آرایه هرگز
	// نمی‌خواند و «can not find this relation» می‌دهد — یعنی `head` و `logo`
	// از هیچ کلاینتی قابل تعیین نبودند. راه‌حل: مقدارِ خالی یعنی «رابطه را
	// پاک کن» و در آن حالت کلید `head` اصلاً در `relations` نمی‌آید تا
	// `replace: true` تنها رابطه‌ی موجود را بردارد.
	for (const [rel, value] of [["head", headId], ["logo", logoId]] as const) {
		if (value === undefined) {
			continue;
		}
		await organization.addRelation({
			filters: { _id: new ObjectId(_id as string) },
			relations: value
				? { [rel]: { _ids: new ObjectId(value as string) } }
				: {},
			replace: true,
			projection: { _id: 1 },
		});
	}

	return await organization.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: get,
	});
};
