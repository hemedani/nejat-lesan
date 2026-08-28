import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { Coordinates, Session } from '@/domain/types';

export type GeoJsonPoint = {
  type: 'Point';
  coordinates: [number, number];
};

export function toGeoJsonPoint(coords: Coordinates): GeoJsonPoint {
  return { type: 'Point', coordinates: [coords.longitude, coords.latitude] };
}

export type SnapPointResponse = {
  road: { _id: string; name: string };
  distanceToRoadMeters: number;
  fromOriginMeters: number;
  totalLengthMeters: number;
  kilometer: number;
  meter: number;
  origin?: string | null;
  destination?: string | null;
  direction: string | null;
  lanes: unknown[];
  nearestPoint: GeoJsonPoint;
};

const SNAP_GET = {
  road: 1,
  distanceToRoadMeters: 1,
  fromOriginMeters: 1,
  totalLengthMeters: 1,
  kilometer: 1,
  meter: 1,
  direction: 1,
  lanes: 1,
} as const;

type SnapRequest = BackendActRequest<'main', 'road', 'snapPointToRoad'>;
type ZoneRequest = BackendActRequest<'main', 'road', 'validatePointInZone'>;

export function snapPointToRoad(
  coords: Coordinates,
  options: ApiRequestOptions = {},
): Promise<SnapPointResponse> {
  return callTypedAct<'main', 'road', 'snapPointToRoad', SnapPointResponse>(
    {
      service: 'main',
      model: 'road',
      act: 'snapPointToRoad',
      details: {
        set: { point: toGeoJsonPoint(coords) } as SnapRequest['details']['set'],
        get: SNAP_GET,
      },
    },
    options,
  );
}

export type ZoneValidationResponse = {
  inZone: boolean;
  reason?: string;
  policeStation: { _id: string; name: string } | null;
};

export function validatePointInZone(
  session: Session,
  coords: Coordinates,
  options: ApiRequestOptions = {},
): Promise<ZoneValidationResponse> {
  return callTypedAct<'main', 'road', 'validatePointInZone', ZoneValidationResponse>(
    {
      service: 'main',
      model: 'road',
      act: 'validatePointInZone',
      details: {
        set: { point: toGeoJsonPoint(coords) } as ZoneRequest['details']['set'],
        get: { inZone: 1, policeStation: 1 },
      },
    },
    { token: session.token, ...options },
  );
}
