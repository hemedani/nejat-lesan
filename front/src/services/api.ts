import { lesanApi } from "@/types/declarations/selectInp";

const envLesanUrl = process.env.LESAN_URL as string;

// Function to get the appropriate URL based on environment
const getLesanUrl = (): string => {
  // Check if we're on the server side
  const isServerSide = typeof window === "undefined";

  if (isServerSide) {
    // Server-side: use internal Docker network or env variable
    return envLesanUrl ? `${envLesanUrl}/lesan` : "http://localhost:1404/lesan";
  } else {
    // Client-side: check for public env var first, then detect production
    const publicLesanUrl = process.env.NEXT_PUBLIC_LESAN_URL;
    if (publicLesanUrl) {
      return `${publicLesanUrl}/lesan`;
    }

    // If no public env var, check if we're in production by looking at the current hostname
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      // In production, construct the backend URL based on current hostname
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:1404/lesan`;
    }

    // Default to localhost for development
    return "http://localhost:1404/lesan";
  }
};

// Helper function to get base URL without /lesan suffix
export const getLesanBaseUrl = (): string => {
  // Check if we're on the server side
  const isServerSide = typeof window === "undefined";

  if (isServerSide) {
    // Server-side: use internal Docker network or env variable
    return envLesanUrl || "http://localhost:1404";
  } else {
    // Client-side: check for public env var first, then detect production
    const publicLesanUrl = process.env.NEXT_PUBLIC_LESAN_URL;
    if (publicLesanUrl) {
      return publicLesanUrl;
    }

    // If no public env var, check if we're in production by looking at the current hostname
    if (
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      // In production, construct the backend URL based on current hostname
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      return `${protocol}//${hostname}:1404`;
    }

    // Default to localhost for development
    return "http://localhost:1404";
  }
};

// Export the main function for external use
export { getLesanUrl };

export const AppApi = (lesanUrl?: string) =>
  lesanApi({
    URL: lesanUrl ? lesanUrl : getLesanUrl(),
    baseHeaders: {
      connection: "keep-alive",
    },
  });
