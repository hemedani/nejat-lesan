import { type ObjectId } from "@deps";
import { organization, road } from "../../../mod.ts";
import { throwError } from "@lib";

/**
 * داده‌ی ثابتِ سازمان دمو: آزادراه اهواز – بندر امام (شرکت ره).
 *
 * این مقادیر کلیدِ idempotency هستند؛ اگر روزی عوض شوند اجرای دوباره‌ی اکشن
 * نسخه‌ی دومی از همان سازمان می‌سازد.
 */
export const DEMO_ROAD_NAME = "آزادراه اهواز – بندر امام";
export const DEMO_ORG_CODE = "AHR";
export const DEMO_ORG_NAME =
	"شرکت احداث، نگهداری و بهره‌برداری آزادراه اهواز – بندر امام (ره)";
export const DEMO_ORG_EN_NAME =
	"Ahvaz – Bandar Imam (RAH) Freeway Construction, Maintenance, and Operation Company";

/**
 * هندسه‌ی راه: یک خط ۷ رأسی از اهواز (شمال‌غرب) تا بندر امام (جنوب‌شرق).
 *
 * `road.area` یک `MultiLineString` است، پس مختصات یک آرایه‌ی اضافه دارد و
 * GeoDB همیشه `[longitude, latitude]` می‌خواهد (نه `[lat, lng]`).
 */
export const DEMO_ROAD_AREA: {
	type: "MultiLineString";
	coordinates: [number, number][][];
} = {
	type: "MultiLineString",
	coordinates: [
		[
			[48.6706, 31.3183],
			[48.75, 31.25],
			[48.85, 31.15],
			[48.95, 31.0],
			[49.05, 30.85],
			[49.15, 30.65],
			[49.2, 30.556],
		],
	],
};

export type DemoRoad = { _id: ObjectId; name: string };
export type DemoOrganization = {
	_id: ObjectId;
	code: string;
	name: string;
	road?: { _id?: ObjectId };
};

export type Ensured<TRow> = { doc: TRow; created: boolean };

/**
 * خطای فارسی می‌دهد و `never` برمی‌گرداند تا TypeScript مسیر را ببندد.
 *
 * `throwError` خودش `void` برمی‌گرداند، پس بعد از فراخوانی‌اش هیچ محدودیتی
 * اعمال نمی‌شود و TypeScript فکر می‌کند کد بعدی هنوز اجرا می‌شود. امضا صریح
 * لازم است: TypeScript فقط فراخوانیِ تابعی را که نوعِ بازگشتی‌اش صریحاً `never`
 * اعلام شده در تحلیل جریان کنترل، «برنمی‌گردد» می‌داند.
 */
export const fail: (message: string) => never = (message) =>
	(throwError as (msg?: string) => never)(message);

/** `fail` + باریک‌کردنِ نوع، برای بررسی نتیجه‌ی `insertOne`. */
export const required = <TRow>(
	row: TRow,
	message: string,
): NonNullable<TRow> => {
	if (row === null || row === undefined) fail(message);
	return row as NonNullable<TRow>;
};

/**
 * سازمان دمو را *بدون ساختن* برمی‌گرداند.
 *
 * لازم است چون جست‌وجوی راه به شناسه‌ی سازمان نیاز دارد تا «راهِ همین نام که
 * مالِ این سازمان است» را از «راهِ همین نام که مالِ سازمانِ دیگری است» جدا
 * کند — و ترتیبِ ساخت (اول راه، بعد سازمان) اجازه نمی‌دهد سازمان زودتر ساخته شود.
 */
export const findDemoOrganization = async (): Promise<
	DemoOrganization | null
> => await organization.findOne({
	filters: { code: DEMO_ORG_CODE },
	projection: { _id: 1, code: 1, name: 1, "road._id": 1 },
}) as unknown as DemoOrganization | null;

/**
 * راه را با نامش می‌سازد یا همان را برمی‌گرداند.
 *
 * `road` ایندکس یکتا روی `name` ندارد، پس جست‌وجو روی «نام + پیوندِ سازمان»
 * انجام می‌شود: راهی که همین نام را دارد ولی مالِ سازمانِ دیگری است نه مالِ
 * ماست و نه اجازه داریم برداریمش — `ensureDemoOrganization` با `replace: true`
 * پیوندِ برعکسِ آن سازمان را پاک می‌کند. چنین راهی نادیده گرفته می‌شود و
 * نسخه‌ی خودمان ساخته می‌شود؛ `road.name` یکتا نیست و `unit.add` هم راه را با
 * شناسه پیدا می‌کند، پس دو راهِ هم‌نام مبهمی ایجاد نمی‌شود.
 *
 * @param ownedByOrgId شناسه‌ی سازمان دمو، اگر از قبل وجود داشته باشد؛ `null`
 * یعنی هنوز ساخته نشده و تنها راهِ آزاد (بدون سازمان) قابل قبول است.
 */
export const ensureDemoRoad = async (
	{
		registrer,
		ownedByOrgId,
	}: { registrer: ObjectId; ownedByOrgId: ObjectId | null },
): Promise<Ensured<DemoRoad>> => {
	const existing = await road.findOne({
		filters: {
			name: DEMO_ROAD_NAME,
			...(ownedByOrgId
				? {
					$or: [
						{ "organization._id": ownedByOrgId },
						{ organization: { $exists: false } },
					],
				}
				: { organization: { $exists: false } }),
		},
		projection: { _id: 1, name: 1 },
	}) as unknown as DemoRoad | null;

	if (existing) return { doc: existing, created: false };

	const created = await road.insertOne({
		doc: {
			name: DEMO_ROAD_NAME,
			area: DEMO_ROAD_AREA,
			origin: "اهواز",
			destination: "بندر امام",
			total_length_meters: 60000,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { registrer: { _ids: registrer } },
		projection: { _id: 1, name: 1 },
	}) as unknown as DemoRoad | null;

	return { doc: required(created, "ساخت راه دمو ناموفق بود"), created: true };
};

/**
 * سازمان را با `code` می‌سازد یا همان را برمی‌گرداند.
 *
 * `organization.code` ایندکس یکتای اجباری است، پس هرگز نباید تهی بماند.
 *
 * پیوند `road` هم ترمیم می‌شود نه فقط موقع ساخت: یک سازمانِ بی‌راه در دمو
 * بی‌فایده است — `resolveOversightScope` گزارش‌های قدیمی را از راهِ
 * `organization.road._id` پیدا می‌کند و `unit.add` واحدی را که راهش با راهِ
 * سازمان فرق کند رد می‌کند.
 */
export const ensureDemoOrganization = async (
	{ registrer, roadId }: { registrer: ObjectId; roadId: ObjectId },
): Promise<Ensured<DemoOrganization>> => {
	const existing = await organization.findOne({
		filters: { code: DEMO_ORG_CODE },
		projection: { _id: 1, code: 1, name: 1, "road._id": 1 },
	}) as unknown as DemoOrganization | null;

	if (existing) {
		if (existing.road?._id?.toString() !== roadId.toString()) {
			await organization.addRelation({
				filters: { _id: existing._id },
				relations: {
					road: {
						_ids: roadId,
						relatedRelations: { organization: true },
					},
				},
				// رابطه‌ی تکیِ پرشده بدون `replace` خطا می‌دهد.
				replace: true,
				projection: { _id: 1 },
			});
		}
		return {
			doc: { ...existing, road: { _id: roadId } },
			created: false,
		};
	}

	const created = await organization.insertOne({
		doc: {
			code: DEMO_ORG_CODE,
			name: DEMO_ORG_NAME,
			enName: DEMO_ORG_EN_NAME,
			description:
				"سازمان دموی آزادراه اهواز – بندر امام: نگهداری، بهره‌برداری و گشت محور.",
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			road: { _ids: roadId, relatedRelations: { organization: true } },
			registrer: { _ids: registrer },
		},
		projection: { _id: 1, code: 1, name: 1, "road._id": 1 },
	}) as unknown as DemoOrganization | null;

	return {
		doc: required(created, "ساخت سازمان دمو ناموفق بود"),
		created: true,
	};
};
