import { ObjectId } from "@deps";
import { operation_log } from "../mod.ts";

/**
 * ثبت لاگ ممیزی برای جهش‌های مدیریتی (تخصیص/حذف روابط و ...).
 * خطای لاگ‌گیری هرگز جریان اصلی را نمی‌شکند.
 */
export const logOperation = async (
	{
		actorId,
		action,
		entityType,
		entityId,
		summary,
		changes,
	}: {
		actorId?: ObjectId;
		action: string;
		entityType: string;
		entityId: string | ObjectId;
		summary?: string;
		changes?: unknown;
	},
): Promise<void> => {
	try {
		await operation_log.insertOne({
			doc: {
				action,
				entity_type: entityType,
				entity_id: entityId.toString(),
				summary,
				changes: changes === undefined
					? undefined
					: JSON.stringify(changes),
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			relations: actorId ? { actor: { _ids: actorId } } : undefined,
			projection: { _id: 1 },
		});
	} catch (error) {
		console.error("operation_log failed:", error);
	}
};
