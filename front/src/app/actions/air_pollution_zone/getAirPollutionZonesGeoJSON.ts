"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

interface AirPollutionZoneRow {
  _id: string;
  name: string;
  area?: { type: string; coordinates: unknown };
  city?: { _id: string; name: string };
}

export const getAirPollutionZonesGeoJSON = async (zoneNames: string[]) => {
  const token = (await cookies()).get("token");

  try {
    const response = await AppApi().send(
      {
        service: "main",
        model: "air_pollution_zone",
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
      throw new Error("Failed to fetch air pollution zones");
    }

    const nameSet = new Set(zoneNames);

    const features = (response.body as AirPollutionZoneRow[])
      .filter((zone) => nameSet.has(zone.name))
      .map((zone) => ({
        type: "Feature",
        properties: {
          id: zone._id,
          name: zone.name,
          cityId: zone.city?._id,
          cityName: zone.city?.name,
          zoneType: "airPollutionZone",
        },
        geometry: zone.area || {
          type: "MultiPolygon",
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
    console.error("Error fetching air pollution zones GeoJSON:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};