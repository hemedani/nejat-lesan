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

/**
 * The origin that backend **assets** are served from, e.g. `${base}/uploads/…`.
 *
 * This is not the API origin. API calls go through `POST /api/proxy`, but static
 * uploads are not proxied — only `back/mod.ts` declares `staticPath: ["/uploads"]`
 * — so an asset URL must be built against the backend itself. Two tiers, because
 * `docker-compose.yml` sets both and only one of them is reachable from a given
 * side of the wire:
 *
 * - server → `LESAN_URL` (`http://backend:1404`), a Docker-internal name that a
 *   browser could not resolve even if it were handed one
 * - browser → `NEXT_PUBLIC_LESAN_URL` (`http://46.245.98.10:1404`), the public host
 *
 * The browser tier used to return `window.location.origin`, which built every
 * attachment URL against the Next.js origin and 404'd: `getLesanBaseUrl` was
 * repointed at the current origin for the API proxy, but the proxy covers only
 * `${LESAN_URL}/lesan`. Both `report/AttachmentGallery` and `molecules/UploadFile`
 * render backend images, so both were affected. See
 * `.workbuddy-ai/tools/uploads-base-url-test.py`.
 */
export const getLesanBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return process.env.LESAN_URL || "http://localhost:1404";
  }

  // Same-origin fallback: correct when one host fronts both tiers (nginx), which
  // is why the branch order is load-bearing rather than the fallback being absent.
  return process.env.NEXT_PUBLIC_LESAN_URL || window.location.origin;
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
