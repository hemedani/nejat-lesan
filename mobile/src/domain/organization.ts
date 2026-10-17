import type { Coordinates, PatrolOrganization } from './types';

/**
 * بازه‌ی بزرگ‌نماییِ مشترک: `native-map.tsx` و این ماژول باید یکی باشند؛ نقشه هر
 * عددِ بیرون از این بازه را خودش می‌بُرد، پس ناهم‌خوانی یعنی «قابِ مأمور» با
 * «قابِ واقعی نقشه» یکی نبود.
 */
export const MIN_MAP_ZOOM = 3;
export const MAX_MAP_ZOOM = 19;

/**
 * بزرگ‌نماییِ پیش‌فرض صفحه‌ی انتخاب محل، وقتی سازمان عددی نداده است.
 *
 * عددِ پیشِ این تغییر همین بود و عمداً حفظ شده تا مأموری که سازمانش نقطه ندارد
 * همان رفتارِ آشنا را ببیند.
 */
export const DEFAULT_INCIDENT_ZOOM = 17;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * مرکز سازمان به‌صورت `Coordinates`، یا `null`.
 *
 * نقطه رویِ سیم GeoDB با ترتیب `[longitude, latitude]` می‌آید و
 * `Coordinates` برعکسِ آن است، پس اینجا جابه‌جایی رخ می‌دهد. اگر جابه‌جا نشود،
 * مرکزِ اهواز روی نقطه‌ای در اقیانوس هند می‌افتد.
 *
 * بازه‌ی جغرافیایی همین‌جا چک می‌شود: نشستِ ذخیره‌شده ممکن است از بک‌اندِ
 * کهنه‌تر یا دستکاری‌شده آمده باشد و نقطه‌ی بی‌معنا نباید قاب نقشه را خراب کند.
 */
export function organizationPoint(
  organization: PatrolOrganization | null | undefined,
): Coordinates | null {
  const location = organization?.location;
  if (!location || location.type !== 'Point') {
    return null;
  }

  const coordinates = location.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = coordinates;
  if (!isFiniteNumber(longitude) || !isFiniteNumber(latitude)) {
    return null;
  }
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * بزرگ‌نماییِ پیش‌فرض نقشه برای سازمان، بیضی‌شده به بازه‌ی معتبر.
 *
 * بک‌اند عدد را ذخیره می‌کند ولی بازه‌اش را تضمین نمی‌کند (چون
 * `organization_pure` هم‌زمان پروژکشن را هم اعتبارسنجی می‌کند و `range` در
 * `@deps` وجود ندارد). مصرف‌کننده باید خودش محافظ باشد تا یک مقدارِ کهنه در
 * نشست، قابِ نقشه را به بیرون از محدوده‌ی بی‌معنا ببرد.
 */
export function organizationZoom(
  organization: PatrolOrganization | null | undefined,
  fallback: number = DEFAULT_INCIDENT_ZOOM,
): number {
  const zoom = organization?.location_zoom;
  if (!isFiniteNumber(zoom)) {
    return fallback;
  }
  return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, Math.round(zoom)));
}

/** متنِ مختصات برای نمایش، مثل «۴۸٫۶۷، ۳۱٫۳۲». */
export function formatCoordinates(point: Coordinates): string {
  return `${point.longitude.toLocaleString('fa-IR', {
    maximumFractionDigits: 4,
  })}، ${point.latitude.toLocaleString('fa-IR', { maximumFractionDigits: 4 })}`;
}