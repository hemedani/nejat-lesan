"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

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

    const features = response.body.map(
      (zone: {
        _id: string;
        name: string;
        area?: { type: string; coordinates: unknown };
        city?: { _id: string; name: string };
      }) => ({
        type: "Feature",
        properties: {
          id: zone._id,
          name: zone.name,
          cityId: zone.city?._id,
          cityName: zone.city?.name,
        },
        geometry: zone.area || {
          type: "Polygon",
          coordinates: [[]],
        },
      }),
    );

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
