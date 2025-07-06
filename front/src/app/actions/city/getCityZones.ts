"use server";
import { AppApi } from "@/services/api";

import { cookies } from "next/headers";

interface CityZone {
  _id: string;
  name: string;
  city: {
    _id: string;
    name: string;
  };
  area?: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

// Helper function for fuzzy city name matching
const fuzzyMatchCityName = (targetCity: string, cityName: string): boolean => {
  if (!targetCity || !cityName) return false;

  // Normalize both strings (trim, lowercase, remove extra spaces)
  const normalizeString = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, " ");

  const normalizedTarget = normalizeString(targetCity);
  const normalizedCity = normalizeString(cityName);

  // Exact match
  if (normalizedTarget === normalizedCity) return true;

  // Contains match
  if (
    normalizedTarget.includes(normalizedCity) ||
    normalizedCity.includes(normalizedTarget)
  ) {
    return true;
  }

  // Common variations for Ahvaz
  if (normalizedTarget === "اهواز" || normalizedCity === "اهواز") {
    return (
      normalizedTarget === "اهواز" ||
      normalizedCity === "اهواز" ||
      normalizedTarget === "ahvaz" ||
      normalizedCity === "ahvaz"
    );
  }

  return false;
};

export const getCityZonesGeoJSON = async (cityName: string) => {
  const token = (await cookies()).get("token");

  try {
    const response = await AppApi().send(
      {
        service: "main",
        model: "city_zone",
        act: "gets",
        details: {
          set: {
            page: 1,
            limit: 1000,
          },
          get: {
            _id: 1,
            name: 1,
            area: 1,
            city: {
              _id: 1,
              name: 1,
            },
          },
        },
      },
      { token: token?.value },
    );

    if (!response.success || !response.body) {
      console.error(
        "Failed to fetch city zones:",
        response.error || "Unknown error",
      );
      throw new Error("Failed to fetch city zones");
    }

    // Transform the response into a valid GeoJSON FeatureCollection
    const zones = response.body;

    // Filter zones by city if needed (since API doesn't support city filtering)
    const filteredZones = zones.filter(
      (zone: CityZone) =>
        !cityName || fuzzyMatchCityName(zone.city.name, cityName),
    );

    if (filteredZones.length === 0) {
      // If no exact match found, try fallback strategies
      if (zones.length > 0) {
        // Strategy 1: Try to find zones for any city with similar name
        const similarCityZones = zones.filter((zone: CityZone) => {
          const cityName = zone.city.name.toLowerCase();
          return (
            cityName.includes("اهواز") ||
            cityName.includes("ahvaz") ||
            cityName.includes("خوز") ||
            cityName.includes("khuz")
          );
        });

        if (similarCityZones.length > 0) {
          const features = similarCityZones.map((zone: CityZone) => ({
            type: "Feature",
            properties: {
              id: zone._id,
              name: zone.name,
              cityId: zone.city._id,
              cityName: zone.city.name,
            },
            geometry: zone.area || {
              type: "Polygon",
              coordinates: [[]],
            },
          }));

          return {
            success: true,
            body: {
              type: "FeatureCollection",
              features: features,
            },
          };
        }

        // Strategy 2: Use the first available city's zones
        const firstCity = zones[0].city.name;

        const firstCityZones = zones.filter(
          (zone: CityZone) => zone.city.name === firstCity,
        );

        if (firstCityZones.length > 0) {
          const features = firstCityZones.map((zone: CityZone) => ({
            type: "Feature",
            properties: {
              id: zone._id,
              name: zone.name,
              cityId: zone.city._id,
              cityName: zone.city.name,
            },
            geometry: zone.area || {
              type: "Polygon",
              coordinates: [[]],
            },
          }));

          return {
            success: true,
            body: {
              type: "FeatureCollection",
              features: features,
            },
          };
        }
      }
    }

    const features = filteredZones.map((zone: CityZone) => ({
      type: "Feature",
      properties: {
        id: zone._id,
        name: zone.name,
        cityId: zone.city._id,
      },
      geometry: zone.area || {
        type: "Polygon",
        coordinates: [[]],
      },
    }));

    return {
      success: true,
      body: {
        type: "FeatureCollection",
        features: features,
      },
    };
  } catch (error) {
    console.error("Error fetching city zones GeoJSON:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
