import { number, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";

/**
 * قرارداد انتقال تصاویر حوادث از کلاینت موبایل (JSON):
 * فایل به‌صورت base64 در `set.file.data` ارسال می‌شود؛ چون ترنسپورت
 * lesanApi صرفاً JSON است و پشتیبانی multipart ندارد.
 *
 * - `name`: نام اصلی فایل (برای حفظ پسوند)
 * - `type`: MIME type (image/jpeg | image/png | image/webp | image/heic)
 * - `data`: محتوای فایل با کدگذاری base64
 */
export const uploadAccidentImagesValidator = () => {
	return object({
		set: object({
			category: string(), // plate | insurance | croquis | facility_damage (alias: damage) | other
			accidentId: optional(objectIdValidation),
			sequence: optional(number()),
			file: object({
				name: string(),
				type: string(),
				data: string(),
			}),
		}),
		get: selectStruct("file", 1),
	});
};
