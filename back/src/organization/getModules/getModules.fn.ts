import { type ActFn } from "@deps";
import { coreApp } from "../../../mod.ts";
import { getEnabledModuleKeys } from "../../app_modules/moduleConfig.ts";
import { getOrgModuleRows } from "../../app_modules/orgModules.ts";
import { getScopedOrgIds } from "../../app_modules/orgScope.ts";
import { type MyContext, throwError } from "@lib";

/**
 * وضعیت ماژول‌های یک سازمان برای کلاینت (وب/موبایل):
 *  - deployment : کلیدهای فعال در سطح نصب
 *  - modules    : سطرهای سطح سازمان (غیاب = پیش‌فرض فعال)
 *  - effective  : کلیدهای واقعاً فعال = deployment ∩ سازمان
 */
export const getModulesFn: ActFn = async (body) => {
	const {
		set: { organizationId },
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	// دسترسی: مدیر/شبح سراسری یا کاربرِ دارای این سازمان در scope
	if (user.level !== "Ghost" && user.level !== "Manager") {
		const scoped = await getScopedOrgIds(user);
		if (!scoped.includes(organizationId as string)) {
			return throwError("شما به این سازمان دسترسی ندارید");
		}
	}

	const deployment = getEnabledModuleKeys();
	const rows = await getOrgModuleRows(organizationId as string);
	const effective = deployment.filter((key) =>
		rows.find((r) => r.key === key)?.enabled
	);

	return { deployment, modules: rows, effective };
};
