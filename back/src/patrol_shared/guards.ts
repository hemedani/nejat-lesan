import { throwError } from "@lib";

/**
 * سیاست دسترسی عملیات گشت:
 * - Ghost: همه عملیات مدیریتی
 * - Manager: مدیریت عملیاتی مطابق سیاست فعلی محصول
 * - Patrol و سایر سطوح: فقط خواندن داده‌های خودشان (در اکشن‌های مربوطه)
 */
export const canManagePatrolOperations = (
	level?: string,
): boolean => level === "Ghost" || level === "Manager";

export const assertCanManagePatrolOperations = (level?: string) => {
	if (!canManagePatrolOperations(level)) {
		throwError("شما اجازه مدیریت عملیات گشت را ندارید");
	}
};

export interface OfficerLike {
	_id: { toString(): string };
	level?: string;
	is_active?: boolean;
	first_name?: string;
	last_name?: string;
}

export interface VehicleLike {
	_id: { toString(): string };
	is_active?: boolean;
	title?: string;
	plaque_no?: [string, string, string];
}

/**
 * همه افسران باید سطح Patrol داشته باشند؛ کاربر غیرفعال هم پذیرفته نمی‌شود.
 */
export const assertOfficersAssignable = (officers: OfficerLike[]) => {
	for (const officer of officers) {
		const id = officer?._id?.toString() ?? "?";
		if (!officer || officer.level !== "Patrol") {
			throwError(
				`کاربر با شناسه ${id} مأمور گشت نیست؛ فقط کاربران با سطح «Patrol» قابل تخصیص هستند`,
			);
		}
		if (officer.is_active === false) {
			throwError(
				`مأمور با شناسه ${id} غیرفعال است و قابل تخصیص به گشت نیست`,
			);
		}
	}
};

/**
 * خودروها باید موجود و فعال باشند.
 */
export const assertVehiclesAssignable = (vehicles: VehicleLike[]) => {
	for (const vehicle of vehicles) {
		const id = vehicle?._id?.toString() ?? "?";
		if (!vehicle) {
			throwError(`خودرو با شناسه ${id} یافت نشد`);
		}
		if (vehicle.is_active === false) {
			throwError(
				`خودرو با شناسه ${id} غیرفعال است و قابل تخصیص به گشت نیست`,
			);
		}
	}
};

export interface UnitConflict {
	_id: { toString(): string };
	code?: string;
	name?: string;
}

/**
 * جلوگیری از تخصیص انحصاری‌شکن: افسر/خودرو نباید در گشت فعال دیگری باشد.
 */
export const assertNoUnitConflicts = (
	conflicts: UnitConflict[],
	kind: "officerIds" | "vehicleIds",
) => {
	if (conflicts.length > 0) {
		const c = conflicts[0];
		const what = kind === "officerIds" ? "مأمور" : "خودرو";
		throwError(
			`${what} قبلاً به گشت فعال دیگری («${c.name ?? "?"}» با کد ${
				c.code ?? "?"
			}) تخصیص یافته است؛ ابتدا آن را از گشت قبلی حذف کنید`,
		);
	}
};

/**
 * نرمال‌سازی صفحه‌بندی سمت سرور.
 */
export const normalizePagination = (
	page?: number,
	limit?: number,
	maxLimit = 100,
): { page: number; limit: number; skip: number } => {
	const safePage = Math.max(1, Math.floor(page ?? 1));
	const safeLimit = Math.min(
		maxLimit,
		Math.max(1, Math.floor(limit ?? 20)),
	);
	return {
		page: safePage,
		limit: safeLimit,
		skip: (safePage - 1) * safeLimit,
	};
};
