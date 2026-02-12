import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the server-side environment variable
    const backendUrl = process.env.LESAN_URL || "http://localhost:1404";
    const fullUrl = `${backendUrl}/lesan`;

    // Get the authorization token from cookies or headers
    const authHeader = request.headers.get("authorization") || request.headers.get("token");
    const cookieHeader = request.headers.get("cookie");

    // Check if this is a multipart request (for file uploads)
    const contentType = request.headers.get("content-type");
    let requestBody: BodyInit;
    let headers: Record<string, string>;

    if (contentType && contentType.includes("multipart/form-data")) {
      // For multipart requests (file uploads), we need to forward the form data
      requestBody = await request.formData();

      // Don't set content-type header for FormData as fetch will set it with the correct boundary
      headers = {
        connection: "keep-alive",
      };
    } else {
      // For regular JSON requests
      const body = await request.json();
      requestBody = JSON.stringify(body);

      headers = {
        "Content-Type": "application/json",
        connection: "keep-alive",
      };
    }

    // Add authentication header if present
    if (authHeader) {
      headers["token"] = authHeader;
    }

    // Add cookie header if present
    if (cookieHeader) {
      headers["cookie"] = cookieHeader;
    }

    // Forward the request to the backend service
    const response = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: requestBody,
    });

    // Get the response body
    let responseData;
    const responseContentType = response.headers.get("content-type");

    if (responseContentType && responseContentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      // For non-JSON responses (like file uploads), get text response
      responseData = await response.text();

      // Try to parse as JSON if possible, otherwise return as text
      try {
        responseData = JSON.parse(responseData);
      } catch {
        // If it's not valid JSON, return as text
        responseData = { success: true, body: responseData };
      }
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        body: { message: "Proxy request failed" },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
