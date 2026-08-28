import { type ActFn, ensureDir, ObjectId } from "@deps";
import { decodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import { accident, coreApp, file } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

const CATEGORY_LIMITS: Record<string, { maxSize: number; maxCount: number }> = {
	plate: { maxSize: 5 * 1024 * 1024, maxCount: 1 },
	insurance: { maxSize: 5 * 1024 * 1024, maxCount: 1 },
	// موبایل به مأمور اجازه می‌دهد چند نقشه‌کشی ضمیمه کند؛ سقف با او هم‌تراز شد
	croquis: { maxSize: 10 * 1024 * 1024, maxCount: 10 },
	facility_damage: { maxSize: 5 * 1024 * 1024, maxCount: 10 },
	other: { maxSize: 10 * 1024 * 1024, maxCount: 20 },
};

/** نام‌های مجاز از سمت موبایل → نام دسته روی سرور */
const CATEGORY_ALIASES: Record<string, string> = {
	damage: "facility_damage",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * بررسی مالکیت گزارش:
 * - Patrol فقط به گزارش خودش می‌تواند تصویر پیوند بزند.
 * - Manager/Ghost فقط باید موجود بودن گزارش را بسنجند.
 */
const assertAccidentAccess = async (
	actor: MyContext["user"],
	accidentId?: string,
) => {
	if (!accidentId) return;

	const report = await accident.findOne({
		filters: { _id: new ObjectId(accidentId as string) },
		projection: { _id: 1, "officer._id": 1 },
	});

	if (!report) {
		return throwError("گزارش حوادث مورد نظر یافت نشد");
	}

	if (
		actor.level === "Patrol" &&
		report.officer?._id?.toString() !== actor._id.toString()
	) {
		return throwError(
			"شما فقط به گزارش‌های خودتان می‌توانید فایل اضافه کنید",
		);
	}
};

export const uploadAccidentImagesFn: ActFn = async (body) => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		set: { category: rawCategory, accidentId, sequence, file: filePayload },
		get,
	} = body.details;

	// Normalize mobile category aliases (e.g. "damage" -> "facility_damage")
	const category = rawCategory in CATEGORY_ALIASES
		? CATEGORY_ALIASES[rawCategory]
		: rawCategory;

	// Validate category
	const limits = CATEGORY_LIMITS[category];
	if (!limits) {
		return throwError("دسته‌بندی فایل نامعتبر است");
	}

	if (!filePayload || typeof filePayload.data !== "string") {
		return throwError("محتوای فایل ارسال نشده است");
	}

	// Decode base64 payload (JSON wire format)
	let bytes: Uint8Array;
	try {
		bytes = decodeBase64(filePayload.data);
	} catch (_error) {
		return throwError("محتوای فایل base64 معتبر نیست");
	}

	if (bytes.length === 0) {
		return throwError("فایل خالی است");
	}

	// Validate file type
	if (!ALLOWED_TYPES.includes(filePayload.type)) {
		return throwError("فرمت فایل مجاز نیست (فقط JPEG, PNG, WebP, HEIC)");
	}

	// Validate the real byte size (not a client-claimed size)
	if (bytes.length > limits.maxSize) {
		const maxMB = limits.maxSize / (1024 * 1024);
		return throwError(`حجم فایل نباید از ${maxMB} مگابایت بیشتر باشد`);
	}

	// Ownership check before linking to an existing accident
	await assertAccidentAccess(user, accidentId);

	// If accidentId provided, check count for this category
	if (accidentId) {
		const existingCount = await file.countDocument({
			filter: {
				"accident._id": new ObjectId(accidentId as string),
				category,
			},
		});
		if (existingCount >= limits.maxCount) {
			return throwError(
				`حداکثر ${limits.maxCount} فایل برای دسته ${category} مجاز است`,
			);
		}
	}

	const uploadDir = "./uploads/accidents";
	await ensureDir(uploadDir);

	const safeName = (filePayload.name || "upload").replace(/[/\\]/g, "_");
	const finalFileName = `${new ObjectId()}-${safeName}`;
	await Deno.writeFile(`${uploadDir}/${finalFileName}`, bytes);

	const doc: Record<string, any> = {
		name: finalFileName,
		type: filePayload.type,
		size: bytes.length,
		category,
		sequence: sequence || 0,
	};

	const relations: Record<string, any> = {
		uploader: {
			_ids: new ObjectId(user._id),
			relatedRelations: {
				uploadedAssets: true,
			},
		},
	};

	if (accidentId) {
		relations.accident = {
			_ids: new ObjectId(accidentId as string),
			relatedRelations: {
				attachments: true,
			},
		};
	}

	return await file.insertOne({
		doc,
		relations,
		projection: get,
	});
};
