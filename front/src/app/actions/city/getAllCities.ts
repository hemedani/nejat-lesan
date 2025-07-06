"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

interface City {
  _id: string;
  name: string;
  province?: {
    _id: string;
    name: string;
  };
}

export const getAllCities = async () => {
  const token = (await cookies()).get("token");

  try {
    const response = await AppApi().send(
      {
        service: "main",
        model: "city",
        act: "gets",
        details: {
          set: {
            page: 1,
            limit: 1000,
          },
          get: {
            _id: 1,
            name: 1,
            province: {
              _id: 1,
              name: 1,
            },
          },
        },
      },
      { token: token?.value },
    );

    if (!response.success || !response.body) {
      throw new Error("Failed to fetch cities");
    }

    const cities = response.body;
    console.log(`Total cities found: ${cities.length}`);

    // Log first few cities for debugging
    cities.slice(0, 10).forEach((city: City, index: number) => {
      console.log(`City ${index + 1}: ${city.name} (ID: ${city._id})`);
    });

    // Look for Ahvaz specifically
    const ahvazCities = cities.filter((city: City) =>
      city.name.includes("اهواز") ||
      city.name.includes("ahvaz") ||
      city.name.toLowerCase().includes("ahvaz")
    );

    if (ahvazCities.length > 0) {
      console.log("Found Ahvaz cities:", ahvazCities);
    } else {
      console.log("No Ahvaz cities found. Available cities starting with 'ا':");
      cities
        .filter((city: City) => city.name.startsWith("ا"))
        .slice(0, 5)
        .forEach((city: City) => {
          console.log(`- ${city.name} (ID: ${city._id})`);
        });
    }

    return {
      success: true,
      body: cities,
    };
  } catch (error) {
    console.error("Error fetching cities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
