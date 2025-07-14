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
    // Client-side: always use localhost for browser requests
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
    // Client-side: always use localhost for browser requests
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
