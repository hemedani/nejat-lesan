"use client";

import { useEffect, useRef, type RefObject } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { GeoPoint } from "@/types/patrol";
import type { MapApi, MapBounds, NearbyAccidentPoint } from "./nearby-accidents-types";

/**
 * Leaflet's default marker sprites resolve relative to the bundler output, so
 * they 404 under Next. Point them at the CDN copies instead — same URLs the
 * project's other map surfaces use.
 */
const MARKER_ICON = {
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
};

function boundsOf(map: L.Map): MapBounds {
  const bounds = map.getBounds();
  return {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  };
}

/** GeoJSON stores coordinates as [lng, lat]; leaflet wants [lat, lng]. */
function latLngOf(location?: GeoPoint | null): [number, number] | null {
  const coordinates = location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return [lat, lng];
}

/**
 * Bridges react-leaflet's hook context to the surrounding React tree: publishes
 * an imperative `flyTo` handle upward and reports the visible box on every pan
 * or zoom so the toolbar can re-query the current view.
 */
function MapBridge({
  apiRef,
  onBounds,
}: {
  apiRef: RefObject<MapApi | null>;
  onBounds: (bounds: MapBounds) => void;
}) {
  const map = useMap();
  const onBoundsRef = useRef(onBounds);
  onBoundsRef.current = onBounds;

  useEffect(() => {
    apiRef.current = {
      flyTo: (lat: number, lng: number, zoom = 14) => map.setView([lat, lng], zoom),
    };

    const emit = () => onBoundsRef.current(boundsOf(map));
    emit();
    map.on("moveend", emit);
    map.on("zoomend", emit);

    return () => {
      map.off("moveend", emit);
      map.off("zoomend", emit);
      apiRef.current = null;
    };
  }, [map, apiRef]);

  return null;
}

export default function NearbyAccidentsMapClient({
  accidents,
  center,
  apiRef,
  onBounds,
}: {
  accidents: NearbyAccidentPoint[];
  center: [number, number];
  apiRef: RefObject<MapApi | null>;
  onBounds: (bounds: MapBounds) => void;
}) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions(MARKER_ICON);
  }, []);

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapBridge apiRef={apiRef} onBounds={onBounds} />
      {accidents.map((item) => {
        const position = latLngOf(item.location);
        if (!position) return null;
        return (
          <Marker key={item._id} position={position}>
            <Popup>
              <div dir="rtl" className="space-y-1 text-right text-xs leading-5">
                <p className="font-semibold">{item.type_name || item.incident_type || "حادثه"}</p>
                {item.seri && <p>سری: {item.seri}</p>}
                {item.incident_severity_name && <p>شدت: {item.incident_severity_name}</p>}
                {item.date_of_accident && <p>تاریخ: {item.date_of_accident}</p>}
                {item.review_status && <p>وضعیت بررسی: {item.review_status}</p>}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
