import { lesanApi } from "@/types/declarations/selectInp";
import Cookies from "js-cookie";

// Function to get the appropriate URL based on environment
const getLesanUrl = (): string => {
  // Check if we're on the server side
  const isServerSide = typeof window === "undefined";

  let url: string;

  if (isServerSide) {
    // Server-side: use internal Docker network or env variable
    const envLesanUrl = process.env.LESAN_URL as string;
    url = envLesanUrl ? `${envLesanUrl}/lesan` : "http://localhost:1404/lesan";
  } else {
    // Client-side: use the proxy route to avoid CORS issues
    url = "/api/proxy";
  }

  return url;
};

// Helper function to get base URL without /lesan suffix
export const getLesanBaseUrl = (): string => {
  // Check if we're on the server side
  const isServerSide = typeof window === "undefined";

  let baseUrl: string;

  try {
    if (isServerSide) {
      // Server-side: use internal Docker network or env variable
      const envLesanUrl = process.env.LESAN_URL as string;
      baseUrl = envLesanUrl || "http://localhost:1404";
    } else {
      // Client-side: return the base URL of the current origin
      baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    }

    return baseUrl;
  } catch {
    // Fallback to localhost on error
    return "http://localhost:1404";
  }
};

// Export the main function for external use
export { getLesanUrl };

export const AppApi = (lesanUrl?: string, token?: string | undefined) => {
  try {
    const url = lesanUrl ? lesanUrl : getLesanUrl();

    // Determine if we're on the client side
    const isClientSide = typeof window !== "undefined";

    // Get token from cookies if not provided
    const authToken = token || (isClientSide ? Cookies.get("token") : null);

    // Set up base headers with possible authentication
    const baseHeaders: Record<string, string> = {
      connection: "keep-alive",
    };

    // Include token if available - backend expects it in "token" field without "Bearer" prefix
    if (authToken) {
      baseHeaders["token"] = `${authToken}`;
    }

    // If we're on the client side and using the proxy, we need to handle the request differently
    if (isClientSide && url === "/api/proxy") {
      // Create a compatible API function that sends requests to our proxy
      const send = async (body: unknown, additionalHeaders?: Record<string, string | undefined>) => {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...baseHeaders,
              ...additionalHeaders,
              ...(authToken ? { token: authToken } : {}),
            },
            body: JSON.stringify(body),
          });

          return await response.json();
        } catch (error) {
          console.error("API call error:", error);
          return {
            success: false,
            body: { message: "Network error occurred" },
          };
        }
      };

      const setHeaders = (headers: Record<string, string>) => {
        Object.assign(baseHeaders, headers);
      };

      return { send, setHeaders };
    }

    return lesanApi({
      URL: url,
      baseHeaders,
    });
  } catch (error) {
    console.error("AppApi error:", error);
    // Fallback to default URL on error
    return lesanApi({
      URL: "http://localhost:1404/lesan",
      baseHeaders: {
        connection: "keep-alive",
      },
    });
  }
};
