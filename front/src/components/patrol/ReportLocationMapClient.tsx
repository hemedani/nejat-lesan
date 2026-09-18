"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { GeoPoint } from "@/types/patrol";

/**
 * Leaflet's default marker sprites resolve relative to the bundler output, so
 * they 404 under Next and markers render as broken images. Point them at the
 * CDN copies instead — the same fix the project's other map surfaces apply.
 */
const MARKER_ICON = {
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
};

export default function ReportLocationMapClient({ location, gps }: { location?: GeoPoint; gps?: GeoPoint }) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions(MARKER_ICON);
  }, []);

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
