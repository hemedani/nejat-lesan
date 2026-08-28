import { coreApp } from "../mod.ts";

/**
 * مدل مجازی «عملیات گشت».
 * هیچ سندی در این کالکشن ذخیره نمی‌شود؛ فقط میزبان اکشن‌های تجمیعی
 * (مثل getOperationsSummary) برای پنل مدیریت عملیات گشت است.
 */
export const patrol_operations_pure = {};

export const patrol_operations_relations = {};

export const patrol_operationss = () =>
	coreApp.odm.newModel(
		"patrol_operations",
		patrol_operations_pure,
		patrol_operations_relations,
	);
