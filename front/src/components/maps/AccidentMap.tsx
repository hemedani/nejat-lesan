"use client";

import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
} from "react-leaflet";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Types
import { accidentSchema } from "@/types/declarations/selectInp";

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    className: "custom-marker",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const fatalIcon = createCustomIcon("#EF4444"); // Red
const injuryIcon = createCustomIcon("#F97316"); // Orange
const damageIcon = createCustomIcon("#EAB308"); // Yellow
const defaultIcon = createCustomIcon("#6B7280"); // Gray

// Map event handler component
const MapEventHandler: React.FC<{ onZoomChange: (zoom: number) => void }> = ({
  onZoomChange,
}) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  return null;
};

// Accident Map Component
const AccidentMap: React.FC<{
  accidents: accidentSchema[];
  isLoading: boolean;
}> = ({ accidents, isLoading }) => {
  const [currentZoom, setCurrentZoom] = useState(6);
  const showHeatmap = currentZoom < 10;

  // Prepare heatmap data
  const heatmapPoints = accidents
    .map((accident) => {
      const coords = accident.location?.coordinates;
      if (!coords || coords.length < 2) return null;

      // Weight based on severity
      let weight = 1;
      if (accident.type?.name === "فوتی") weight = 3;
      else if (accident.type?.name === "جرحی") weight = 2;
      else if (accident.type?.name === "خسارتی") weight = 1;

      return [coords[1], coords[0], weight]; // [lat, lng, weight]
    })
    .filter(Boolean) as [number, number, number][];

  // Get marker icon based on accident type
  const getMarkerIcon = (accident: accidentSchema) => {
    switch (accident.type?.name) {
      case "فوتی":
        return fatalIcon;
      case "جرحی":
        return injuryIcon;
      case "خسارتی":
        return damageIcon;
      default:
        return defaultIcon;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fa-IR");
  };

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">در حال بارگیری نقشه...</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[32.4279, 53.688]} // Center of Iran
        zoom={6}
        className="w-full h-full"
        style={{ minHeight: "600px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEventHandler onZoomChange={setCurrentZoom} />

        {/* Conditional rendering based on zoom level */}
        {showHeatmap && heatmapPoints.length > 0 && (
          <HeatmapLayer
            fitBoundsOnLoad
            fitBoundsOnUpdate
            points={heatmapPoints}
            longitudeExtractor={(m: [number, number, number]) => m[1]}
            latitudeExtractor={(m: [number, number, number]) => m[0]}
            intensityExtractor={(m: [number, number, number]) => m[2]}
            gradient={{
              0.1: "#89f7fe",
              0.2: "#66d9ef",
              0.4: "#38b2ac",
              0.6: "#ed8936",
              0.8: "#f56565",
              1.0: "#c53030",
            }}
            max={5}
            radius={20}
            blur={15}
            minOpacity={0.3}
          />
        )}

        {!showHeatmap && (
          <>
            {accidents.map((accident, index) => {
              const coords = accident.location?.coordinates;
              if (!coords || coords.length < 2) return null;

              return (
                <Marker
                  key={`${accident._id}-${index}`}
                  position={[coords[1], coords[0]]}
                  icon={getMarkerIcon(accident)}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-semibold text-lg mb-2 text-gray-800">
                        جزئیات تصادف
                      </h3>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">سریال:</span>
                          <span className="font-medium">{accident.serial}</span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">تاریخ:</span>
                          <span className="font-medium">
                            {formatDate(accident.date_of_accident)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">نوع:</span>
                          <span
                            className={`font-medium ${
                              accident.type?.name === "فوتی"
                                ? "text-red-600"
                                : accident.type?.name === "جرحی"
                                  ? "text-orange-600"
                                  : accident.type?.name === "خسارتی"
                                    ? "text-yellow-600"
                                    : "text-gray-600"
                            }`}
                          >
                            {accident.type?.name || "نامشخص"}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">فوتی:</span>
                          <span className="font-medium text-red-600">
                            {accident.dead_count}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">مجروح:</span>
                          <span className="font-medium text-orange-600">
                            {accident.injured_count}
                          </span>
                        </div>

                        {accident.collision_type?.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">نوع برخورد:</span>
                            <span className="font-medium">
                              {accident.collision_type.name}
                            </span>
                          </div>
                        )}

                        {accident.province?.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">استان:</span>
                            <span className="font-medium">
                              {accident.province.name}
                            </span>
                          </div>
                        )}

                        {accident.city?.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">شهر:</span>
                            <span className="font-medium">
                              {accident.city.name}
                            </span>
                          </div>
                        )}

                        {accident.road?.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">راه:</span>
                            <span className="font-medium">
                              {accident.road.name}
                            </span>
                          </div>
                        )}

                        {accident.light_status?.name && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">وضعیت نور:</span>
                            <span className="font-medium">
                              {accident.light_status.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <h4 className="font-semibold text-sm mb-2">راهنما</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>فوتی</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>جرحی</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>خسارتی</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
          {showHeatmap ? "نمایش حرارتی" : "نمایش نقاط"}
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg z-[1000]">
        <div className="text-sm">
          <div className="font-semibold">
            تعداد تصادفات: {accidents.length.toLocaleString("fa-IR")}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            زوم: {currentZoom} | {showHeatmap ? "حرارتی" : "نقاط"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentMap;
