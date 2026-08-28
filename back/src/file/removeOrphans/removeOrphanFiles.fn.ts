import { type ActFn, ObjectId } from "@deps";
import { file } from "../../../mod.ts";

const DEFAULT_OLDER_THAN_DAYS = 7;

/**
 * حذف فایل‌های بی‌صاحب:
 * فایل‌های آپلودشده‌ای که هیچ accident_id ندارند، از تاریخ قطع (پیش‌فرض ۷ روز)
 * قدیمی‌ترند و در رابطه attachments هیچ گزارشی ارجاع نشده‌اند.
 * سندهای فایل و بایت‌های روی دیسک هر دو حذف می‌شوند (حذف دیسک best-effort).
 */
export const removeOrphanFilesFn: ActFn = async (body) => {
	const {
		set: { olderThanDays },
	} = body.details;

	const days = typeof olderThanDays === "number" && olderThanDays > 0
		? olderThanDays
		: DEFAULT_OLDER_THAN_DAYS;

	const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

	const orphanDocs = await file
		.aggregation({
			pipeline: [
				{
					$match: {
						accident: { $exists: false },
						createdAt: { $lt: cutoff },
					},
				},
				{
					$lookup: {
						from: "accident",
						let: { fid: "$_id" },
						pipeline: [
							{
								$match: {
									$expr: {
										$gt: [
											{
												$size: {
													$ifNull: [
														{
															$filter: {
																input: {
																	$ifNull: [
																		"$attachments",
																		[],
																	],
																},
																cond: {
																	$eq: [
																		"$$this._id",
																		"$$fid",
																	],
																},
															},
														},
														[],
													],
												},
											},
											0,
										],
									},
								},
							},
							{ $project: { _id: 1 } },
						],
						as: "refs",
					},
				},
				{ $match: { refs: { $size: 0 } } },
				{ $project: { name: 1 } },
			],
			projection: { _id: 1, name: 1 },
		})
		.toArray();

	let removed = 0;
	for (const doc of orphanDocs) {
		try {
			await Deno.remove(`./uploads/accidents/${doc.name}`);
		} catch (_error) {
			// disk cleanup is best-effort; the doc removal below is authoritative
		}
		await file.deleteOne({ filter: { _id: new ObjectId(doc._id) } });
		removed++;
	}

	return { removed };
};
