import { type ActFn, ensureDir, ObjectId } from "@deps";
import { coreApp, file } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

const CATEGORY_LIMITS: Record<string, { maxSize: number; maxCount: number }> = {
	plate: { maxSize: 5 * 1024 * 1024, maxCount: 1 },
	insurance: { maxSize: 5 * 1024 * 1024, maxCount: 1 },
	croquis: { maxSize: 10 * 1024 * 1024, maxCount: 1 },
	facility_damage: { maxSize: 5 * 1024 * 1024, maxCount: 10 },
	other: { maxSize: 10 * 1024 * 1024, maxCount: 20 },
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export const uploadAccidentImagesFn: ActFn = async (body) => {
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		set: { category, accidentId, sequence, file: fileToUpload },
		get,
	} = body.details;

	// Validate category
	const limits = CATEGORY_LIMITS[category];
	if (!limits) {
		return throwError("دسته‌بندی فایل نامعتبر است");
	}

	// Validate file type
	if (!ALLOWED_TYPES.includes(fileToUpload.type)) {
		return throwError("فرمت فایل مجاز نیست (فقط JPEG, PNG, WebP, HEIC)");
	}

	// Validate file size
	if (fileToUpload.size > limits.maxSize) {
		const maxMB = limits.maxSize / (1024 * 1024);
		return throwError(`حجم فایل نباید از ${maxMB} مگابایت بیشتر باشد`);
	}

	// If accidentId provided, check count for this category
	if (accidentId) {
		const existingCount = await file.countDocument({
			filter: {
				accident_id: new ObjectId(accidentId as string),
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

	const finalFileName = `${new ObjectId()}-${fileToUpload.name}`;
	await Deno.writeFile(
		`${uploadDir}/${finalFileName}`,
		fileToUpload.stream(),
	);

	const doc: Record<string, any> = {
		name: finalFileName,
		type: fileToUpload.type,
		size: fileToUpload.size,
		category,
		sequence: sequence || 0,
	};

	if (accidentId) {
		doc.accident_id = new ObjectId(accidentId as string);
	}

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