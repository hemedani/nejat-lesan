import { type ActFn, type Infer, object, ObjectId } from "@deps";
import { road } from "../../../mod.ts";
import { road_pure } from "@model";
import { assertLanesExist, deriveTotalLength } from "../roadSetStruct.ts";

/**
 * `road.update` — همه‌ی فیلدهای pure، و رابطه‌ی `province` جدا.
 *
 * دو نکته که این فایل قبلاً نداشت و حالا دارد:
 *
 * 1. **پاک‌کردن با رشته‌ی خالی کار می‌کند.** نسخه‌ی قبل `name && (...)` بود، پس
 *    تغییر نام به "" بی‌سروصدا نادیده گرفته می‌شد. شرطِ `!== undefined` فرقِ
 *    «نفرستاده» و «فرستاده شده و خالی است» را نگه می‌دارد — دقیقاً همان چیزی که
 *    `organization/update.fn.ts` هم می‌کند.
 *
 * 2. **هیچ رابطه‌ای از `$set` رد نمی‌شود.** `province` از راه `addRelation` می‌رود
 *    (با `relatedRelations.roads` تا برعکسش هم به‌روز شود)، چون رابطه هیچ‌وقت با
 *    `findOneAndUpdate` نوشته نمی‌شود.
 */
export const updateFn: ActFn = async (body) => {
	const {
		set: { _id, provinceId, lanes, ...rest },
		get,
	} = body.details;

	if (lanes) {
		await assertLanesExist(
			lanes as unknown as { _id: string; name: string }[],
		);
	}

	const pureStruct = object(road_pure);
	const updateObj: Partial<Infer<typeof pureStruct>> = {
		updatedAt: new Date(),
	};

	for (const [key, value] of Object.entries(rest)) {
		if (value !== undefined) {
			(updateObj as Record<string, unknown>)[key] = value;
		}
	}

	// `lanes` بیرون از حلقه است چون باید جداگانه مدیریت شود: آرایه‌ی خالی یعنی
	// «خطوط را پاک کن»، که با شرطِ `!== undefined` گم می‌شود اگر صرفاً از حلقه
	// رد شود.
	if (lanes !== undefined) {
		updateObj.lanes = lanes as never;
	}

	// `area` در `rest` هست؛ اگر آمده باشد طول دوباره حساب می‌شود تا مقدارِ
	// ذخیره‌شده با خطی که رویش snap می‌شود یکی بماند.
	if (rest.area) {
		updateObj.total_length_meters = deriveTotalLength(rest.area as never);
	}

	await road.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: { $set: updateObj },
		projection: { _id: 1 },
	});

	if (provinceId !== undefined) {
		// رابطه‌ی تکی: مقدار باید یک ObjectId تنها باشد، نه آرایه.
		// `handleSingleRelation` با `{_id: _ids}` فیلتر می‌کند و آرایه هرگز
		// نمی‌خواند و «can not find this relation» می‌دهد.
		//
		// مقدارِ خالی یعنی «رابطه را پاک کن»: در آن حالت کلید `province` اصلاً
		// در `relations` نمی‌آید تا `replace: true` تنها رابطه‌ی موجود را بردارد.
		await road.addRelation({
			filters: { _id: new ObjectId(_id as string) },
			relations: provinceId
				? {
					province: {
						_ids: new ObjectId(provinceId as string),
						relatedRelations: { roads: true },
					},
				}
				: {},
			// رابطه‌ی تکیِ پرشده بدون `replace` خطا می‌دهد.
			replace: true,
			projection: { _id: 1 },
		});
	}

	return await road.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: get,
	});
};
