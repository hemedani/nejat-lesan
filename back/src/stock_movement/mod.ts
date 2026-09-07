import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { countSetup } from "./count/mod.ts";

// Read-only: هیچ اکشن add/update/remove ثبت نمی‌شود — تراکنش‌ها فقط توسط
// inventoryManager نوشته می‌شوند.
export const stockMovementSetup = () => {
	getSetup();
	getsSetup();
	countSetup();
};
