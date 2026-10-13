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
 * هندسه‌ی راه: محور واقعی آزادراه اهواز – بندر امام (ره)، از اهواز تا بندر امام.
 *
 * `road.area` یک `MultiLineString` است، پس مختصات یک آرایه‌ی اضافه دارد و
 * GeoDB همیشه `[longitude, latitude]` می‌خواهد (نه `[lat, lng]`).
 *
 * چرا این‌قدر رأس دارد: نسخه‌ی قبلی یک خط ۷ رأسی و تقریباً مستقیم بود، پس
 * `road.snapPointToRoad` نقطه را روی یک خط خیالی می‌نشاند و مسیر روی نقشه با
 * انحراف چند صد متری از آزادراه کشیده می‌شد. رأس‌ها اینجا از خودِ محور
 * آزادراه/بزرگراه خلیج فارس (OSM، `ref=5`) گرفته شده‌اند.
 *
 * بازتولید: مسیر رانندگی بین دو سرِ محور از سرویس مسیریابی OSM گرفته و با
 * الگوریتم Ramer–Douglas–Peucker با تلورانس ۲۵ متر ساده شده است (بیشترین
 * انحراف باقی‌مانده ≈ ۲۴٫۵ متر). اگر روزی لازم شد دوباره ساخته شود، همین
 * تلورانس را نگه دارید تا `DEMO_ROAD_LENGTH_METERS` هم‌چنان درست بماند.
 */
export const DEMO_ROAD_AREA: {
	type: "MultiLineString";
	coordinates: [number, number][][];
} = {
	type: "MultiLineString",
	coordinates: [
		[
			[48.67056, 31.31823],
			[48.66953, 31.31866],
			[48.67089, 31.32100],
			[48.67816, 31.31907],
			[48.67859, 31.32110],
			[48.67978, 31.32329],
			[48.68938, 31.33032],
			[48.68978, 31.33024],
			[48.69315, 31.32864],
			[48.69470, 31.32701],
			[48.69535, 31.32743],
			[48.69552, 31.32814],
			[48.69613, 31.32830],
			[48.70057, 31.32595],
			[48.70201, 31.32568],
			[48.70719, 31.32112],
			[48.71052, 31.31647],
			[48.71984, 31.31016],
			[48.72028, 31.30880],
			[48.72545, 31.30573],
			[48.73275, 31.30282],
			[48.74155, 31.29994],
			[48.74406, 31.29960],
			[48.74610, 31.30031],
			[48.75337, 31.30663],
			[48.75441, 31.30669],
			[48.77486, 31.29380],
			[48.78480, 31.28620],
			[48.79152, 31.27608],
			[48.80072, 31.25172],
			[48.80533, 31.24252],
			[48.82418, 31.21686],
			[48.85085, 31.18505],
			[48.86197, 31.16792],
			[48.86775, 31.15589],
			[48.87020, 31.15178],
			[48.88557, 31.13240],
			[48.90776, 31.09504],
			[48.91774, 31.08026],
			[48.92182, 31.07324],
			[48.93797, 31.03705],
			[48.94133, 31.03093],
			[48.94987, 31.01758],
			[48.96223, 30.99344],
			[48.96434, 30.98994],
			[48.98974, 30.95444],
			[48.99391, 30.94753],
			[48.99900, 30.93676],
			[49.01674, 30.91258],
			[49.03727, 30.87616],
			[49.04140, 30.86549],
			[49.04800, 30.84025],
			[49.06006, 30.80235],
			[49.06173, 30.79408],
			[49.06564, 30.76601],
			[49.07625, 30.72632],
			[49.07731, 30.72012],
			[49.07619, 30.69482],
			[49.08014, 30.64605],
			[49.07964, 30.63642],
			[49.07716, 30.61399],
			[49.07731, 30.60291],
			[49.08107, 30.57795],
			[49.08326, 30.57101],
			[49.08714, 30.56292],
			[49.08806, 30.55805],
			[49.08740, 30.55301],
			[49.08137, 30.53718],
			[49.08030, 30.53552],
			[49.07712, 30.53383],
			[49.07604, 30.53288],
			[49.07479, 30.53021],
			[49.07475, 30.52747],
			[49.07354, 30.52701],
			[49.07641, 30.52135],
			[49.07520, 30.50933],
			[49.07881, 30.49682],
			[49.07812, 30.49438],
			[49.07271, 30.48745],
			[49.07227, 30.48530],
			[49.07942, 30.46826],
			[49.07979, 30.46661],
			[49.07936, 30.45898],
			[49.07602, 30.44999],
			[49.07657, 30.44414],
			[49.07607, 30.44267],
			[49.07477, 30.44141],
			[49.07683, 30.44105],
			[49.07675, 30.43898],
			[49.07555, 30.43894],
			[49.07542, 30.43597],
		],
	],
};

/**
 * طول محور بر حسب متر، با همان روشی حساب شده که `utils/geo.ts` برای
 * linear referencing به کار می‌برد (تقریب مستطیلیِ موضعی). این عدد به‌عنوان
 * `road.total_length_meters` ذخیره می‌شود و `road.snapPointToRoad` آن را
 * جای محاسبه‌ی مجدد برمی‌گرداند، پس باید با `DEMO_ROAD_AREA` هم‌خوان بماند.
 */
export const DEMO_ROAD_LENGTH_METERS = 116342;

/**
 * امضای هندسه، برای تشخیص «هندسه‌ی ذخیره‌شده با هندسه‌ی کد یکی است».
 *
 * `ensureDemoRoad` روی درخواستِ idempotent چیزی نمی‌سازد؛ بدون این مقایسه،
 * دیتابیس‌هایی که راه دمو را با هندسه‌ی قدیمی دارند هرگز ترمیم نمی‌شدند و
 * انحراف مسیر روی نقشه باقی می‌ماند.
 */
const geometrySignature = (coordinates: [number, number][][]): string =>
	coordinates
		.map((line) =>
			line.map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`)
				.join(";")
		)
		.join("|");

const DEMO_ROAD_SIGNATURE = geometrySignature(DEMO_ROAD_AREA.coordinates);

/**
 * مرکز عملیاتی سازمان دمو — همان سرِ اهوازِ محور.
 *
 * نقطه از `DEMO_ROAD_AREA` *مشتق* می‌شود، نه اینکه جداگانه نوشته شود: اگر
 * روزی هندسه‌ی محور بازتولید شد، مرکزِ سازمان نمی‌تواند از محور جدا بیفتد.
 * ترتیب مختصات هم مثل بقیه‌ی GeoDB است: `[longitude, latitude]`.
 *
 * این نقطه در اپ مأمور دو جا می‌آید: قابِ اولیه‌ی صفحه‌ی «انتخاب محل حادثه»
 * وقتی GPS در دسترس نیست، و دکمه‌ی «مرکز سازمان».
 */
export const DEMO_ORG_LOCATION: {
	type: "Point";
	coordinates: [number, number];
} = {
	type: "Point",
	coordinates: DEMO_ROAD_AREA.coordinates[0][0],
};

/**
 * بزرگ‌نمایی پیش‌فرض نقشه برای سازمان دمو.
 *
 * محور اهواز – بندر امام حدود ۱۱۶ کیلومتر است؛ ۱۳ قابِ نقشه تقریباً دوسومِ
 * شرقیِ همین کریدور را می‌گیرد. عدد عمداً ثابت و صریح است، نه «پیش‌فرضِ» مدل،
 * چون قابِ خوب برای یک کریدورِ بلند با قابِ خوبِ یک آزادراهِ کوتاهِ شهری فرق
 * دارد.
 */
export const DEMO_ORG_ZOOM = 13;

export type DemoRoad = {
	_id: ObjectId;
	name: string;
	area?: { type: "MultiLineString"; coordinates: [number, number][][] };
	total_length_meters?: number;
};
export type DemoOrganization = {
	_id: ObjectId;
	code: string;
	name: string;
	road?: { _id?: ObjectId };
	location?: { type: "Point"; coordinates: [number, number] };
	location_zoom?: number;
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
 * هندسه هم مثل پیوند ترمیم می‌شود، نه فقط موقع ساخت. راهِ موجود با هندسه‌ی
 * قدیمی (خطِ ۷ رأسی) تا ابد منحرف می‌ماند، چون روی درخواست‌های بعدی هیچ
 * نوشتنی رخ نمی‌دهد؛ پس تفاوتِ امضا/طول با `findOneAndUpdate` جبران می‌شود.
 * این دو فیلد pure هستند و رابطه نیستند، پس `addRelation` جای آن‌ها نیست.
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
		projection: {
			_id: 1,
			name: 1,
			area: 1,
			total_length_meters: 1,
		},
	}) as unknown as DemoRoad | null;

	if (existing) {
		const storedArea = existing.area?.coordinates;
		const geometryDrifted = !storedArea ||
			geometrySignature(storedArea) !== DEMO_ROAD_SIGNATURE;
		const lengthDrifted =
			existing.total_length_meters !== DEMO_ROAD_LENGTH_METERS;

		if (geometryDrifted || lengthDrifted) {
			await road.findOneAndUpdate({
				filter: { _id: existing._id },
				update: {
					$set: {
						area: DEMO_ROAD_AREA,
						total_length_meters: DEMO_ROAD_LENGTH_METERS,
						updatedAt: new Date(),
					},
				},
				projection: { _id: 1, name: 1 },
			});
		}

		return { doc: existing, created: false };
	}

	const created = await road.insertOne({
		doc: {
			name: DEMO_ROAD_NAME,
			area: DEMO_ROAD_AREA,
			origin: "اهواز",
			destination: "بندر امام",
			total_length_meters: DEMO_ROAD_LENGTH_METERS,
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
 *
 * مرکز (`location`/`location_zoom`) هم فقط *غایب* بودنش ترمیم می‌شود، نه
 * هر ناهم‌خوانی‌ای: سازمانی که اپراتور خودش نقطه‌ای روی آن گذاشته، با اجرای
 * دوباره‌ی seed نباید جابه‌جا شود. سازمانِ seed‌شده *پیش* از افزودن این فیلد
 * همین‌طور بی‌نقطه می‌ماند، چون روی درخواستِ idempotent چیزی نمی‌نویسد.
 */
export const ensureDemoOrganization = async (
	{ registrer, roadId }: { registrer: ObjectId; roadId: ObjectId },
): Promise<Ensured<DemoOrganization>> => {
	const existing = await organization.findOne({
		filters: { code: DEMO_ORG_CODE },
		projection: {
			_id: 1,
			code: 1,
			name: 1,
			"road._id": 1,
			location: 1,
			location_zoom: 1,
		},
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

		// هر دو pure هستند، نه رابطه، پس `findOneAndUpdate` جای `addRelation`.
		if (!existing.location) {
			await organization.findOneAndUpdate({
				filter: { _id: existing._id },
				update: {
					$set: {
						location: DEMO_ORG_LOCATION,
						location_zoom: DEMO_ORG_ZOOM,
						updatedAt: new Date(),
					},
				},
				projection: { _id: 1 },
			});
			existing.location = DEMO_ORG_LOCATION;
			existing.location_zoom = DEMO_ORG_ZOOM;
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
			location: DEMO_ORG_LOCATION,
			location_zoom: DEMO_ORG_ZOOM,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			road: { _ids: roadId, relatedRelations: { organization: true } },
			registrer: { _ids: registrer },
		},
		projection: {
			_id: 1,
			code: 1,
			name: 1,
			"road._id": 1,
			location: 1,
			location_zoom: 1,
		},
	}) as unknown as DemoOrganization | null;

	return {
		doc: required(created, "ساخت سازمان دمو ناموفق بود"),
		created: true,
	};
};
