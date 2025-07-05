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

export const getCityZonesGeoJSON = async (cityId: string) => {
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
      throw new Error("Failed to fetch city zones");
    }

    // Transform the response into a valid GeoJSON FeatureCollection
    const zones = response.body;

    // Filter zones by city if needed (since API doesn't support city filtering)
    const filteredZones = zones.filter(
      (zone: CityZone) => !cityId || zone.city._id === cityId,
    );

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
