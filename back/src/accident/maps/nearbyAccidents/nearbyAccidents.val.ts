import { number, object, optional } from "@deps";
import { enums } from "@deps";

/**
 * اکشن سبک نقشه برای اپ مأمور گشت:
 * خروجی ثابت و کم‌حجم است؛ برخلاف mapAccidents پنل مدیریت،
 * فیلترهای تحلیلی ندارد و فقط حوادث ثبت‌شده (synced) در یک کادر جغرافیایی را می‌دهد.
 */
export const nearbyAccidentsValidator = () => {
	return object({
		set: object({
			minLat: number(),
			maxLat: number(),
			minLng: number(),
			maxLng: number(),
			limit: optional(number()),
		}),
		get: object({
			accidents: optional(enums([0, 1])),
		}),
	});
};
