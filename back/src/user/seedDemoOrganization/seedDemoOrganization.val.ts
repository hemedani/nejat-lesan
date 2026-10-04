import { array, boolean, enums, object, optional } from "@deps";

/**
 * `get` یک ساختار ad-hoc است، نه `selectStruct`.
 *
 * پاسخِ این اکشن از خودِ اسنید ساخته می‌شود (مثل `seedShared` و
 * `getOversightList`) و اصلاً از `get` عبور نمی‌کند، پس این ساختار نه فیلتر
 * است و نه پروژکشن — فقط *اعلام* می‌کند پاسخ چه کلیدهایی دارد. کلیدهای
 * آرایه‌ای با `array(object(...))` آمده‌اند چون واقعاً آرایه‌اند.
 *
 * همه‌چیز `optional` است تا `get: {}` هم معتبر بماند: هارنس تست
 * (`organization-test.ts`) فقط `assert(body.details, act.validator)` می‌کند و
 * `get` را همان‌طور که فراخواننده داده اعتبارسنجی می‌کند، نه آنچه اکشن برمی‌گرداند.
 */
export const seedDemoOrganizationValidator = () => {
	const flag = enums([0, 1]);
	const row = (...keys: string[]) =>
		object(Object.fromEntries(keys.map((key) => [key, optional(flag)])));
	const rows = (...keys: string[]) => array(row(...keys));

	return object({
		// بدون هیچ ورودی اجباری؛ و بدون `reset` هم: idempotency خودش اجرای
		// دوباره را پوشش می‌دهد و یک مسیرِ ویرانگر در یک seeder دمو جایی ندارد.
		set: object({}),
		get: object({
			// اسمش `demoPassword` است نه `password` تا با قاعده‌ی «هیچ‌وقت
			// فیلدی به اسم password را project نکن» اشتباه گرفته نشود؛ این
			// رمزِ ثابتِ همه‌ی حساب‌های دمو است و در خودِ سورس هم هست.
			demoPassword: optional(flag),
			/**
			 * `true` only when nothing was created AND every form was already
			 * active — i.e. this call changed nothing and the organization is
			 * fully seeded. A half-seeded organization (road and units present,
			 * forms missing) reports `false` even though `totalCreated` is 0.
			 */
			alreadySeeded: optional(boolean()),
			organization: optional(row("_id", "code", "name")),
			road: optional(row("_id", "name")),
			units: optional(rows("_id", "code", "name", "type")),
			orgHead: optional(row("_id", "email", "level")),
			unitHeads: optional(rows("_id", "email", "unitCode")),
			officers: optional(rows("_id", "email", "unitCode")),
			vehicles: optional(rows("_id", "plaque_no", "title", "unitCode")),
			// `activated: false` یعنی فرم از قبل فعال بود و این اجرا دستش نزد.
			forms: optional(
				rows(
					"_id",
					"name",
					"form_kind",
					"icon",
					"status",
					"version",
					"activated",
				),
			),
			totalCreated: optional(flag),
			totalReused: optional(flag),
		}),
	});
};
