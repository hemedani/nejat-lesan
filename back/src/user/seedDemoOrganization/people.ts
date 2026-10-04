import { hash, type ObjectId } from "@deps";
import { unit, user, vehicle } from "../../../mod.ts";
import { normalizeOrgRoles } from "@lib";
import { type Ensured, fail, required } from "./org.ts";

/**
 * رمز عبورِ مشترکِ همه‌ی افرادِ دمو، تا در دمو بتوان با هر کدام وارد شد.
 *
 * `user.login` رمز را با `size(string(), 8, 100)` اعتبارسنجی می‌کند، پس کمتر
 * از ۸ کاراکتر نمی‌شود. این متن عمداً در همین فایل ثابت است و در پاسخِ
 * اکشن هم برگردانده می‌شود: این یک دمو است، نه راز.
 */
export const DEMO_PASSWORD = "Demo@1404";

export const DEMO_EMAIL_DOMAIN = "ahvaz-freeway.ir";

/** ایمیل/شماره/کد پرسنلی از `key` و `no` مشتق می‌شوند تا بین اجراها ثابت بمانند. */
export type DemoPerson = {
	key: string;
	no: number;
	first_name: string;
	last_name: string;
	father_name: string;
	gender: "Male" | "Female";
};

export type DemoVehicle = {
	plaque_no: [string, string, string];
	title: string;
};

export type DemoUnit = {
	code: string;
	name: string;
	type: string;
	description: string;
	address: string;
	phone: string;
	head_title: string;
	head: DemoPerson;
	officers: DemoPerson[];
	vehicles: DemoVehicle[];
};

export type DemoUserLevel = "OrgHead" | "UnitHead" | "Patrol";
export type DemoRoleName = "OrgHead" | "UnitHead" | "Officer";

const person = (
	key: string,
	no: number,
	first_name: string,
	last_name: string,
	father_name: string,
	gender: "Male" | "Female",
): DemoPerson => ({ key, no, first_name, last_name, father_name, gender });

export const personEmail = (p: DemoPerson) => `${p.key}@${DEMO_EMAIL_DOMAIN}`;
const personMobile = (p: DemoPerson) => `0912${String(1000000 + p.no)}`;
const personPersonnelCode = (p: DemoPerson) => String(1404000 + p.no);

/**
 * سرپرست سازمان.
 *
 * وجودش حیاتی است: `resolveOversightScope` برای OrgHead به
 * `getOrgReportBase` می‌رود و همه‌ی نقش‌های غیر OrgHead/UnitHead را رد می‌کند،
 * پس بدون این کاربر هیچ‌کس نمی‌تواند گزارش‌های دمو را در کنسول ببیند.
 */
export const DEMO_ORG_HEAD = person(
	"orghead",
	1,
	"کریم",
	"نیک‌روش",
	"علی",
	"Male",
);

const HIGHWAY = "اهواز، کیلومتر ۱۵ آزادراه اهواز – بندر امام";

/**
 * شش واحدِ سازمان، هرکدام با سرپرست، مأمورانِ گشت و دو خودرو.
 *
 * تعداد مأموران: ۲/۲/۲/۲/۱/۱ = ۱۰ نفر. هر مأمور دقیقاً در یک واحد است،
 * چون `resolveFilingOrgId` سازمان را فقط وقتی برمی‌گرداند که مجموعه‌ی
 * واحدهای مأمور به یک سازمان برسد؛ مأمورِ دوواحدی گزارشی می‌سازد که کنسول
 * نمی‌تواند آن را منتسب کند.
 */
export const DEMO_UNITS: DemoUnit[] = [
	{
		code: "AHR-NM-01",
		name: "اداره نگهداری و تعمیرات",
		type: "Maintenance",
		description: "نگهداری فنی، تعمیرات اساسی و رفع نقص راه.",
		address: `${HIGHWAY}، ساختمان اداره نگهداری`,
		phone: "0611-3344010",
		head_title: "رئیس اداره نگهداری",
		head: person("head.nm01", 2, "حسن", "فراهانی", "اکبر", "Male"),
		officers: [
			person("patrol.nm01.1", 8, "علی", "رحیمی", "صفر", "Male"),
			person("patrol.nm01.2", 9, "ابوالفضل", "اکبری", "ناصر", "Male"),
		],
		vehicles: [
			{
				plaque_no: ["41", "ب12", "301"],
				title: "پاترول ۴۱ — نگهداری و تعمیرات",
			},
			{
				plaque_no: ["42", "ب12", "302"],
				title: "تعمیرگاه سیار ۴۲ — نگهداری و تعمیرات",
			},
		],
	},
	{
		code: "AHR-OP-02",
		name: "اداره عملیات و کنترل تردد",
		type: "Ops",
		description: "پایش تردد، مدیریت رویدادها و هماهنگی عملیات.",
		address: `${HIGHWAY}، مرکز کنترل عملیات`,
		phone: "0611-3344020",
		head_title: "رئیس اداره عملیات",
		head: person("head.op02", 3, "مریم", "شریفی", "حسین", "Female"),
		officers: [
			person("patrol.op02.1", 10, "محمدجواد", "نصیری", "هادی", "Male"),
			person("patrol.op02.2", 11, "امیر", "حسینی", "مسعود", "Male"),
		],
		vehicles: [
			{
				plaque_no: ["51", "ب23", "401"],
				title: "پاترول ۵۱ — عملیات و کنترل تردد",
			},
			{
				plaque_no: ["52", "ب23", "402"],
				title: "خودروی پایش ۵۲ — عملیات و کنترل تردد",
			},
		],
	},
	{
		code: "AHR-GS-03",
		name: "اداره گشت محور شمال",
		type: "Patrol",
		description: "گشت محور شمال: کیلومتر صفر تا سی‌وسه.",
		address: `${HIGHWAY}، پاسگاه گشت شمال`,
		phone: "0611-3344030",
		head_title: "فرمانده گشت محور شمال",
		head: person("head.gs03", 4, "سعید", "بهرامی", "محمد", "Male"),
		officers: [
			person("patrol.gs03.1", 12, "سمیرا", "پارسا", "فرهاد", "Female"),
			person("patrol.gs03.2", 13, "فاطمه", "صادقی", "باقر", "Female"),
		],
		vehicles: [
			{
				plaque_no: ["63", "ب34", "501"],
				title: "پاترول ۶۳ — گشت محور شمال",
			},
			{
				plaque_no: ["64", "ب34", "502"],
				title: "پاترول ۶۴ — گشت محور شمال",
			},
		],
	},
	{
		code: "AHR-GS-04",
		name: "اداره گشت محور جنوب",
		type: "Patrol",
		description: "گشت محور جنوب: کیلومتر سی‌وسه تا شصت.",
		address: `${HIGHWAY}، پاسگاه گشت جنوب`,
		phone: "0611-3344040",
		head_title: "فرمانده گشت محور جنوب",
		head: person("head.gs04", 5, "زهرا", "کاظمی", "مهدی", "Female"),
		officers: [
			person("patrol.gs04.1", 14, "مهدی", "گودرزی", "اسد", "Male"),
			person("patrol.gs04.2", 15, "سینا", "فتحی", "داریوش", "Male"),
		],
		vehicles: [
			{
				plaque_no: ["75", "ب45", "601"],
				title: "پاترول ۷۵ — گشت محور جنوب",
			},
			{
				plaque_no: ["76", "ب45", "602"],
				title: "پاترول ۷۶ — گشت محور جنوب",
			},
		],
	},
	{
		code: "AHR-LJ-05",
		name: "اداره پشتیبانی و لجستیک",
		type: "Logistics",
		description: "پشتیبانی فنی، تأمین قطعات و لجستیک نیروگاهان.",
		address: `${HIGHWAY}، انبار و پشتیبانی`,
		phone: "0611-3344050",
		head_title: "رئیس اداره پشتیبانی",
		head: person("head.lj05", 6, "رضا", "موسوی", "جواد", "Male"),
		officers: [
			person("patrol.lj05.1", 16, "رویا", "امینی", "سهراب", "Female"),
		],
		vehicles: [
			{
				plaque_no: ["87", "ب56", "701"],
				title: "وانت پشتیبانی ۸۷ — لجستیک",
			},
			{
				plaque_no: ["88", "ب56", "702"],
				title: "خودروی لجستیک ۸۸ — لجستیک",
			},
		],
	},
	{
		code: "AHR-AD-06",
		name: "اداره امور اداری و منابع انسانی",
		type: "Administration",
		description: "امور اداری، منابع انسانی و روابط عمومی.",
		address: `${HIGHWAY}، ساختمان ستاد`,
		phone: "0611-3344060",
		head_title: "مدیر امور اداری",
		head: person("head.ad06", 7, "نگار", "احمدی", "رضا", "Female"),
		officers: [
			person("patrol.ad06.1", 17, "کامران", "یزدانی", "بهروز", "Male"),
		],
		vehicles: [
			{
				plaque_no: ["99", "ب67", "801"],
				title: "خودروی اداری ۹۹ — امور اداری",
			},
			{
				plaque_no: ["90", "ب67", "802"],
				title: "خودروی اداری ۹۰ — امور اداری",
			},
		],
	},
];

/**
 * هشِ رمزِ مشترک، یک‌بار برای همه‌ی کاربران.
 *
 * bcrypt عمداً کُند است؛ ۱۷ کاربر × یک هش لازم نیست، یک هش کافی است چون
 * رمز همه یکی است. تا وقتی واقعاً کاربری ساخته نمی‌شود هش نمی‌سازیم.
 */
let cachedHash: string | null = null;
const demoPasswordHash = async (): Promise<string> => {
	if (!cachedHash) cachedHash = await hash(DEMO_PASSWORD);
	return cachedHash;
};

/**
 * مأمورِ گشت باید دقیقاً عضوِ یک واحد باشد.
 *
 * `resolveFilingOrgId` (`back/src/accident/reportScope.ts:147-159`) سازمان را
 * فقط وقتی برمی‌گرداند که مجموعه‌ی واحدهای مأمور به یک سازمان برسد؛ و نوشتنِ
 * برعکسِ `unit.officers` یک `$set` بی‌قیدوشر است (`generateUpdateFilter` برای
 * رابطه‌ی تکی)، پس افزودنِ همین مأمور به واحدِ دوم `user.unit` را بی‌صدا به
 * واحدِ دوم می‌برد در حالی که هنوز در `officers` واحدِ اول نشسته است — دقیقاً
 * همان وضعیتی که گزارشش به هیچ کنسولی منتسب نمی‌شود.
 *
 * رد می‌کنیم، نه ترمیم: جابه‌جا کردنِ عضویتِ واحدِ یک شخص تصمیمِ این سیدر نیست.
 *
 * `UnitHead` exempt است: برعکسِ `unit.head` چندتایی است (`user.headedUnits`)
 * و سرپرست دو واحد تناقضی نیست؛ ضمناً او گزارش ثبت نمی‌کند پس
 * `resolveFilingOrgId` هم برایش called نمی‌شود.
 */
const assertSingleUnitMembership = async (
	userId: ObjectId,
	email: string,
	scopeId: ObjectId,
	roleName: DemoRoleName,
): Promise<void> => {
	if (roleName !== "Officer") return;

	const elsewhere = await unit.findOne({
		filters: { "officers._id": userId, _id: { $ne: scopeId } },
		projection: { _id: 1, code: 1 },
	}) as unknown as { _id: ObjectId; code: string } | null;

	if (elsewhere) {
		fail(
			`«${email}» از قبل مأمورِ واحد «${elsewhere.code}» است؛ عضویت واحد را دستی اصلاح کنید.`,
		);
	}
};

/**
 * کاربر را با `email` (کلید یکتای دیتابیس) می‌سازد یا همان را برمی‌گرداند.
 *
 * `password` در `excludes` مدل است، پس فقط و فقط از راه `doc` نوشته می‌شود.
 * `insertOne` مقادیر `defaulted(...)` را اعمال نمی‌کند، پس `is_active`،
 * `is_verified`، `roles`، `failed_login_attempts` و هر دو تاریخ صریح
 * نوشته می‌شوند وگرنه اصلاً در سند نخواهند بود.
 */
export const ensureDemoUser = async (
	{
		person: p,
		level,
		roleName,
		scopeType,
		scopeId,
	}: {
		person: DemoPerson;
		level: DemoUserLevel;
		roleName: DemoRoleName;
		scopeType: "organization" | "unit";
		scopeId: ObjectId;
	},
): Promise<Ensured<{ _id: ObjectId; email: string }>> => {
	const email = personEmail(p);

	const existing = await user.findOne({
		filters: { email },
		projection: { _id: 1, email: 1 },
	}) as unknown as { _id: ObjectId; email: string } | null;

	if (existing) {
		await assertSingleUnitMembership(
			existing._id,
			email,
			scopeId,
			roleName,
		);
		return { doc: existing, created: false };
	}

	const created = await user.insertOne({
		doc: {
			first_name: p.first_name,
			last_name: p.last_name,
			father_name: p.father_name,
			mobile: personMobile(p),
			gender: p.gender,
			email,
			address: HIGHWAY,
			level,
			personnel_code: personPersonnelCode(p),
			password: await demoPasswordHash(),
			...(level === "Patrol" && {
				patrol_permissions: {
					can_submit_accident: true,
					can_view_map: true,
					can_receive_announcements: true,
					can_register_emergency: true,
					can_view_reports: true,
				},
			}),
			// `normalizeOrgRoles` همان `roleId`ای را می‌سازد که بقیه‌ی کد
			// اپسازمان می‌سازد؛ دستی ساختنش نکن.
			roles: normalizeOrgRoles([
				{ name: roleName, scopeType, scopeId: scopeId.toString() },
			]),
			settings: { cities: [], provinces: [] },
			is_active: true,
			is_verified: true,
			failed_login_attempts: 0,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		projection: { _id: 1, email: 1 },
	}) as unknown as { _id: ObjectId; email: string } | null;

	return {
		doc: required(created, "ساخت کاربر دمو ناموفق بود"),
		created: true,
	};
};

export type DemoUnitRow = {
	_id: ObjectId;
	code: string;
	name: string;
	type: string;
	road?: { _id?: ObjectId };
};

/**
 * واحد را با `code` (در دامنه‌ی سازمان) می‌سازد یا همان را برمی‌گرداند.
 *
 * راهِ واحد عمداً همان راهِ سازمان است: `unit.add/add.fn.ts:29-36` واحدی را که
 * راهش با راهِ سازمان فرق کند رد می‌کند. ما مستقیم درج می‌کنیم و هیچ‌چیز این را
 * چک نمی‌کند، پس خودمان درست می‌نویسیم — و در مسیرِ reuse هم اگر راه منحرف
 * شده بود ترمیمش می‌کنیم، دقیقاً مثل `ensureDemoOrganization`.
 */
export const ensureDemoUnit = async (
	{
		spec,
		organizationId,
		roadId,
		registrer,
	}: {
		spec: DemoUnit;
		organizationId: ObjectId;
		roadId: ObjectId;
		registrer: ObjectId;
	},
): Promise<Ensured<DemoUnitRow>> => {
	const existing = await unit.findOne({
		filters: { code: spec.code, "organization._id": organizationId },
		projection: {
			_id: 1,
			code: 1,
			name: 1,
			type: 1,
			"road._id": 1,
		},
	}) as unknown as DemoUnitRow | null;

	if (existing && existing.road?._id?.toString() !== roadId.toString()) {
		await unit.addRelation({
			filters: { _id: existing._id },
			relations: {
				road: { _ids: roadId, relatedRelations: { units: true } },
			},
			// رابطه‌ی تکیِ پرشده بدون `replace` خطا می‌دهد.
			replace: true,
			projection: { _id: 1 },
		});
		return { doc: { ...existing, road: { _id: roadId } }, created: false };
	}

	if (existing) return { doc: existing, created: false };

	const created = await unit.insertOne({
		doc: {
			code: spec.code,
			name: spec.name,
			description: spec.description,
			type: spec.type,
			address: spec.address,
			phone: spec.phone,
			head_title: spec.head_title,
			features: [],
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: {
			organization: {
				_ids: organizationId,
				relatedRelations: { units: true },
			},
			road: { _ids: roadId, relatedRelations: { units: true } },
			registrer: { _ids: registrer },
		},
		projection: { _id: 1, code: 1, name: 1, type: 1, "road._id": 1 },
	}) as unknown as DemoUnitRow | null;

	return {
		doc: required(created, `ساخت واحد «${spec.name}» ناموفق بود`),
		created: true,
	};
};

export type DemoVehicleRow = {
	_id: ObjectId;
	plaque_no: [string, string, string];
	title: string;
};

/**
 * خودرو را با `plaque_no` می‌سازد یا همان را برمی‌گرداند.
 *
 * `plaque_no` یک تاپلی سه‌رشته‌ای است (دو رقم، «ب»+دو رقم، سه رقم) و روی آن
 * ایندکس یکتا نیست؛ تون یکتایی عملی‌اش می‌سازد. رابطه‌ی واحد عمداً در
 * `insertOne` داده نمی‌شود: `unit.vehicles` صاحب رابطه است و بعداً وصل می‌شود.
 */
export const ensureDemoVehicle = async (
	{
		spec,
		unitCode,
		registrer,
	}: { spec: DemoVehicle; unitCode: string; registrer: ObjectId },
): Promise<Ensured<DemoVehicleRow>> => {
	const existing = await vehicle.findOne({
		filters: { plaque_no: spec.plaque_no },
		projection: { _id: 1, plaque_no: 1, title: 1 },
	}) as unknown as DemoVehicleRow | null;
	if (existing) return { doc: existing, created: false };

	const created = await vehicle.insertOne({
		doc: {
			plaque_no: spec.plaque_no,
			title: spec.title,
			is_active: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		relations: { registrer: { _ids: registrer } },
		projection: { _id: 1, plaque_no: 1, title: 1 },
	}) as unknown as DemoVehicleRow | null;

	return {
		doc: required(
			created,
			`ساخت خودروی «${spec.title}» واحد ${unitCode} ناموفق بود`,
		),
		created: true,
	};
};
