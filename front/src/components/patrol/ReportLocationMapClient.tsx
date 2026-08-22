"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { GeoPoint } from "@/types/patrol";

export default function ReportLocationMapClient({ location, gps }: { location?: GeoPoint; gps?: GeoPoint }) {
  const point = location || gps;
  if (!point) return null;
  const center: [number, number] = [point.coordinates[1], point.coordinates[0]];
  return (
    <div className="h-64 overflow-hidden rounded-xl border border-white/10">
      <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {location && (
          <Marker position={[location.coordinates[1], location.coordinates[0]]}>
            <Popup>محل حادثه</Popup>
          </Marker>
        )}
        {gps && (
          <Marker position={[gps.coordinates[1], gps.coordinates[0]]}>
            <Popup>موقعیت GPS مأمور</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
