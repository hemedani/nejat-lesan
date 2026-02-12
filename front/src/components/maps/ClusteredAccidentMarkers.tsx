"use client";

import React, { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { accidentSchema } from "@/types/declarations/selectInp";

// Function to create custom marker icons with variable size
const createCustomIcon = (color: string, size: number = 16) => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Get marker icon based on accident type and size
const getMarkerIcon = (accident: accidentSchema, size: number = 16) => {
  let color;
  switch (accident.type?.name) {
    case "فوتی":
      color = "#EF4444"; // Red
      break;
    case "جرحی":
      color = "#F97316"; // Orange
      break;
    case "خسارتی":
      color = "#EAB308"; // Yellow
      break;
    default:
      color = "#6B7280"; // Gray
      break;
  }

  return createCustomIcon(color, size);
};

// Format date for display
const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("fa-IR");
};

interface ClusteredAccidentMarkersProps {
  accidents: accidentSchema[];
}

interface ClusteredAccident extends accidentSchema {
  clusterSize?: number;
}

const ClusteredAccidentMarkers: React.FC<ClusteredAccidentMarkersProps> = ({ accidents }) => {
  const map = useMap();
  const [visibleMarkers, setVisibleMarkers] = useState<ClusteredAccident[]>([]);
  const boundsRef = useRef<L.LatLngBounds | null>(null);

  // Group nearby accidents to create clusters using a grid-based approach for smoother transitions
  const groupNearbyAccidents = (accidents: accidentSchema[], zoom: number) => {
    // Define clustering distance based on zoom level
    // Higher zoom = smaller clustering distance
    // Use a more gradual scaling to ensure smooth transitions
    const clusteringDistance = Math.max(0.0005, 0.05 / Math.pow(1.8, zoom - 6));

    // Create a grid-based clustering system
    const gridSize = clusteringDistance;
    const grid: { [key: string]: accidentSchema[] } = {};

    // Place each accident in a grid cell
    for (const accident of accidents) {
      const coords = accident.location?.coordinates;
      if (!coords || coords.length < 2) continue;

      const lat = coords[1];
      const lng = coords[0];

      // Calculate grid cell coordinates
      const gridLat = Math.floor(lat / gridSize);
      const gridLng = Math.floor(lng / gridSize);
      const gridKey = `${gridLat},${gridLng}`;

      if (!grid[gridKey]) {
        grid[gridKey] = [];
      }
      grid[gridKey].push(accident);
    }

    // Create clusters from grid cells
    const clusters: { accidents: accidentSchema[]; center: [number, number] }[] = [];

    for (const gridKey in grid) {
      const accidentsInCell = grid[gridKey];

      if (accidentsInCell.length === 1) {
        // Single accident, use its original position
        const coords = accidentsInCell[0].location?.coordinates;
        if (coords && coords.length >= 2) {
          clusters.push({
            accidents: accidentsInCell,
            center: [coords[1], coords[0]], // [lat, lng]
          });
        }
      } else {
        // Multiple accidents in cell, calculate center
        const totalLat = accidentsInCell.reduce(
          (sum, acc) => sum + (acc.location?.coordinates[1] || 0),
          0,
        );
        const totalLng = accidentsInCell.reduce(
          (sum, acc) => sum + (acc.location?.coordinates[0] || 0),
          0,
        );

        clusters.push({
          accidents: accidentsInCell,
          center: [totalLat / accidentsInCell.length, totalLng / accidentsInCell.length],
        });
      }
    }

    return clusters;
  };

  // Filter accidents based on visible bounds and zoom level
  useEffect(() => {
    const updateMarkers = () => {
      const currentBounds = map.getBounds();
      boundsRef.current = currentBounds;

      // Get current zoom level
      const currentZoom = map.getZoom();

      // Filter accidents that are within the current bounds
      const accidentsInBounds = accidents.filter((accident) => {
        const coords = accident.location?.coordinates;
        if (!coords || coords.length < 2) return false;

        const point = L.latLng(coords[1], coords[0]);
        return currentBounds.contains(point);
      });

      // Group nearby accidents into clusters
      const clusters = groupNearbyAccidents(accidentsInBounds, currentZoom);

      // Apply density threshold to avoid too many markers
      let filteredClusters = clusters;
      if (clusters.length > 700) {
        // If we have more than 700 clusters, apply density threshold to limit to 700
        const step = Math.ceil(clusters.length / 700);
        filteredClusters = clusters.filter((_, index) => index % step === 0);
      }

      // At higher zoom levels, show more individual accidents rather than clusters
      // This creates a smoother transition as zoom increases
      const clusterAccidents: ClusteredAccident[] = [];

      for (const cluster of filteredClusters) {
        // Gradually transition from clusters to individual markers based on zoom level
        // At zoom level 16+, always show individual accidents
        // At zoom level 12 and below, always show clusters
        // Between zoom 13-15, use a threshold based on cluster size
        const shouldShowIndividual = (() => {
          if (currentZoom >= 16) {
            return true;
          } else if (currentZoom <= 12) {
            return false;
          } else if (currentZoom === 13) {
            // For zoom level 13, show individual markers only for very small clusters
            return cluster.accidents.length <= 2;
          } else if (currentZoom === 14) {
            // For zoom level 14, show individual markers for small clusters
            return cluster.accidents.length <= 3;
          } else {
            // zoom level 15
            // For zoom level 15, show individual markers for medium clusters
            return cluster.accidents.length <= 5;
          }
        })();

        if (shouldShowIndividual || cluster.accidents.length === 1) {
          // Show individual markers
          for (const accident of cluster.accidents) {
            clusterAccidents.push({
              ...accident,
              clusterSize: 1, // Mark as individual accident
            });
          }
        } else {
          // Show cluster marker
          // Create a "virtual" accident that represents the cluster
          // We'll use the first accident in the cluster as the base for details
          const representativeAccident = cluster.accidents[0];

          clusterAccidents.push({
            ...representativeAccident,
            _id: `cluster-${cluster.center[0]}-${cluster.center[1]}`, // Unique ID for the cluster
            location: {
              type: "Point",
              coordinates: [cluster.center[1], cluster.center[0]], // [lng, lat]
            },
            clusterSize: cluster.accidents.length, // Number of accidents in the cluster
          });
        }
      }

      setVisibleMarkers(clusterAccidents);
    };

    // Update markers immediately
    updateMarkers();

    // Add event listeners
    map.on("moveend", updateMarkers);
    map.on("zoomend", updateMarkers);

    // Cleanup
    return () => {
      map.off("moveend", updateMarkers);
      map.off("zoomend", updateMarkers);
    };
  }, [accidents, map]);

  return (
    <>
      {visibleMarkers.map((accident, index) => {
        const coords = accident.location?.coordinates;
        if (!coords || coords.length < 2) return null;

        // Calculate marker size based on cluster size
        const clusterSize = accident.clusterSize || 1;

        // For individual accidents (clusterSize === 1), use a consistent size
        // For clusters, make the size proportional to the number of accidents
        let markerSize;
        if (clusterSize === 1) {
          // Individual accidents get a consistent size
          markerSize = 10;
        } else {
          // Clusters get larger markers based on the number of accidents
          // Size ranges from 12px (for 2 accidents) to 26px (for 15+ accidents)
          markerSize = Math.min(26, Math.max(12, 8 + clusterSize * 1.5));
        }

        return (
          <Marker
            key={`${accident._id}-${index}`}
            position={[coords[1], coords[0]]}
            icon={getMarkerIcon(accident, markerSize)}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <h3 className="font-semibold text-lg mb-2 text-gray-800">جزئیات تصادف</h3>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">سریال:</span>
                    <span className="font-medium">{accident.serial}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">تاریخ:</span>
                    <span className="font-medium">{formatDate(accident.date_of_accident)}</span>
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
                    <span className="font-medium text-red-600">{accident.dead_count}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">مجروح:</span>
                    <span className="font-medium text-orange-600">{accident.injured_count}</span>
                  </div>

                  {/* Show cluster size if this is a cluster */}
                  {accident.clusterSize && accident.clusterSize > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">تعداد تصادفات:</span>
                      <span className="font-medium text-blue-600">{accident.clusterSize}</span>
                    </div>
                  )}

                  {accident.collision_type?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">نوع برخورد:</span>
                      <span className="font-medium">{accident.collision_type.name}</span>
                    </div>
                  )}

                  {accident.province?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">استان:</span>
                      <span className="font-medium">{accident.province.name}</span>
                    </div>
                  )}

                  {accident.city?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">شهر:</span>
                      <span className="font-medium">{accident.city.name}</span>
                    </div>
                  )}

                  {accident.road?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">راه:</span>
                      <span className="font-medium">{accident.road.name}</span>
                    </div>
                  )}

                  {accident.light_status?.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">وضعیت نور:</span>
                      <span className="font-medium">{accident.light_status.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default ClusteredAccidentMarkers;
