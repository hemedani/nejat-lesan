"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

interface GeoFeature {
  _id: string;
  name: string;
  area?: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
  city?: {
    _id: string;
    name: string;
  };
  province?: {
    _id: string;
    name: string;
  };
}

export const getGeoJSON = async (
  groupBy: "province" | "city" | "city_zone",
) => {
  const token = (await cookies()).get("token");

  try {
    let model: string;
    let includeRelations = {};

    // Determine which model to query based on groupBy
    switch (groupBy) {
      case "province":
        model = "province";
        includeRelations = {
          _id: 1,
          name: 1,
          area: 1,
        };
        break;
      case "city":
        model = "city";
        includeRelations = {
          _id: 1,
          name: 1,
          area: 1,
          province: {
            _id: 1,
            name: 1,
          },
        };
        break;
      case "city_zone":
        model = "city_zone";
        includeRelations = {
          _id: 1,
          name: 1,
          area: 1,
          city: {
            _id: 1,
            name: 1,
          },
        };
        break;
      default:
        throw new Error(`Unsupported groupBy parameter: ${groupBy}`);
    }

    const response = await AppApi().send(
      {
        service: "main",
        model: model as "province" | "city" | "city_zone",
        act: "gets",
        details: {
          set: {
            page: 1,
            limit: 1000,
          },
          get: includeRelations,
        },
      },
      { token: token?.value },
    );

    if (!response.success || !response.body) {
      console.error(
        `Failed to fetch ${groupBy} data:`,
        response.error || "Unknown error",
      );
      throw new Error(`Failed to fetch ${groupBy} data`);
    }

    // Transform the response into a valid GeoJSON FeatureCollection
    const features = response.body;

    if (!Array.isArray(features) || features.length === 0) {
      console.warn(`No ${groupBy} features found`);
      return {
        success: true,
        body: {
          type: "FeatureCollection",
          features: [],
        },
      };
    }

    const geoJsonFeatures = features
      .filter((feature: GeoFeature) => feature.area) // Only include features with area data
      .map((feature: GeoFeature) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const properties: any = {
          id: feature._id,
          name: feature.name,
        };

        // Add parent information based on groupBy level
        if (groupBy === "city" && feature.province) {
          properties.provinceId = feature.province._id;
          properties.provinceName = feature.province.name;
        } else if (groupBy === "city_zone" && feature.city) {
          properties.cityId = feature.city._id;
          properties.cityName = feature.city.name;
        }

        return {
          type: "Feature",
          properties,
          geometry: feature.area || {
            type: "Polygon",
            coordinates: [[]],
          },
        };
      });

    return {
      success: true,
      body: {
        type: "FeatureCollection",
        features: geoJsonFeatures,
      },
    };
  } catch (error) {
    console.error(`Error fetching ${groupBy} GeoJSON:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
