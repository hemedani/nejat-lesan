import { type ObjectId, ObjectId as ObjectIdCtor } from "@deps";
import { organization } from "../../mod.ts";
import { resolvePrimaryOrgId } from "../app_modules/moduleConfig.ts";

/**
 * سازمانِ «تکیِ» فراخواننده، به همان شکلی که `user.login` و `user.getMe`
 * به مأمور نشان می‌دهند.
 *
 * این یک فیلد ثابتِ پاسخ است، نه چیزی که کلاینت در `get` سفارش بدهد — دقیقاً
 * مثل `orgModules` کنارش. یعنی حتی وقتی کلاینت هیچ پروجکشنی نخواست، سازمان
 * برمی‌گردد و اپ مأمور لازم نداشته باشد برای نام سازمان یک درخواست جدا بفرستد.
 *
 * `null` یعنی «سازمانِ تکی قابل تشخیص نیست»: کاربر سراسری (Ghost/Manager) یا
 * عضو چند سازمان. در آن حالت نباید یکی را دلبخواهی نشان دهیم.
 */
export type PrimaryOrganization = {
	_id: string;
	code: string;
	name: string;
	enName?: string;
	/** GeoJSON Point — مختصات به ترتیب [longitude, latitude]. */
	location?: { type: "Point"; coordinates: [number, number] };
	location_zoom?: number;
};

type ScopeUser = {
	_id: unknown;
	level?: string;
	roles?: Array<{ scopeType?: string; scopeId?: string }>;
};

const ORG_PROJECTION = {
	_id: 1,
	code: 1,
	name: 1,
	enName: 1,
	location: 1,
	location_zoom: 1,
} as const;

/**
 * سازمانِ فراخواننده یا `null`.
 *
 * منطقِ scope را قرض نمی‌گیرد، از همان `resolvePrimaryOrgId` استفاده می‌کند که
 * `orgModules` رویش سوار است تا «سازمانِ فعال» در کل بک‌اند یک تعریف داشته
 * باشد: نقش `scopeType:"organization"` → `scopeId`؛ `scopeType:"unit"` →
 * سازمانِ آن واحد؛ مأمور گشت بدون نقش → سازمانِ واحدش (`unit.officers`)؛
 * head انبار → سازمانِ انبارش.
 */
export const getPrimaryOrganization = async (
	user: ScopeUser,
): Promise<PrimaryOrganization | null> => {
	const orgId = await resolvePrimaryOrgId(user);
	if (!orgId) return null;

	const org = await organization.findOne({
		filters: { _id: new ObjectIdCtor(orgId) },
		projection: { ...ORG_PROJECTION },
	}) as unknown as (PrimaryOrganization & { _id: ObjectId }) | null;

	if (!org) return null;

	const { _id, ...rest } = org;
	return { ...rest, _id: _id.toString() };
};
