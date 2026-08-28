import type { Coordinates } from './types';

export const ACCURACY_WARNING_METERS = 50;
export const OFFICER_DISTANCE_WARNING_METERS = 2000;

const EARTH_RADIUS_METERS = 6_371_000;

export function haversineMeters(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters == null || Number.isNaN(meters)) {
    return '—';
  }
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} کیلومتر`;
  }
  return `${Math.round(meters).toLocaleString('fa-IR')} متر`;
}

export function formatCoordinate(value: number): string {
  return value.toLocaleString('fa-IR', { maximumFractionDigits: 6 });
}
