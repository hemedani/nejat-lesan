"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

interface CityZoneRow {
  _id: string;
  name: string;
  area?: { type: string; coordinates: unknown };
  city?: { _id: string; name: string };
}

const buildCityZonesGeoJSON = (zones: CityZoneRow[]) => ({
  success: true,
  body: {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      properties: {
        id: zone._id,
        name: zone.name,
        cityId: zone.city?._id,
        cityName: zone.city?.name,
        zoneType: "cityZone",
      },
      geometry: zone.area || {
        type: "Polygon",
        coordinates: [[]],
      },
    })),
  },
});

export const getCityZonesGeoJSON = async (cityNames: string[]) => {
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
            cityNames,
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

    return buildCityZonesGeoJSON(response.body as CityZoneRow[]);
  } catch (error) {
    console.error("Error fetching city zones GeoJSON:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getCityZonesGeoJSONByNames = async (zoneNames: string[]) => {
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

    const nameSet = new Set(zoneNames);
    const zones = (response.body as CityZoneRow[]).filter((zone) => nameSet.has(zone.name));

    return buildCityZonesGeoJSON(zones);
  } catch (error) {
    console.error("Error fetching city zones GeoJSON by names:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
