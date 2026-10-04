/**
 * ثابت‌های مشترک ماژول‌ها (سطح نصب + سطح سازمان).
 * در فایل جدا تا moduleConfig و orgModules بدون چرخش import به آن ارجاع دهند.
 *
 * ترتیب باربر است: `moduleKeyFor` روی **اولین** کلیدِ منطبق برمی‌گردد، پس
 * `forms` باید **آخر** بماند — وگرنه wildcardِ `incident_patrol` سازمانِ فرم را
 * می‌بلعد و گیتِ فرم‌ساز هرگز اجرا نمی‌شود.
 */
export const MODULE_KEYS = [
	"charts",
	"incident_patrol",
	"warehouse",
	"forms",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MSG_MODULE_DEPLOY_DISABLED = "این ماژول برای این نصب فعال نیست";
export const MSG_MODULE_ORG_DISABLED = "این ماژول برای این سازمان فعال نیست";
