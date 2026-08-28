import { coerce, date, defaulted, number, string, union } from "@deps";

/**
 * تبدیل ورودی‌های متنی تاریخ به Date.
 * کلاینت‌ها رشته ISO یا فرمت سریال‌شده Temporal (با پیشوند "$D") می‌فرستند.
 */
export const toValidDate = (value: string | number): Date => {
	const normalized = typeof value === "number"
		? value
		: value.replace(/^\$D/, "");
	return new Date(normalized);
};

const flexibleDate = coerce(
	date(),
	union([string(), number()]),
	toValidDate,
);

export const createUpdateAt = {
	createdAt: defaulted(flexibleDate, () => new Date()),
	updatedAt: defaulted(flexibleDate, () => new Date()),
};
