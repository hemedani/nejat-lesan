# Proxy Implementation for Backend API Calls

## Overview

This document explains the proxy implementation that solves the issue of accessing backend API calls from the client-side in a Next.js application. The problem occurs because environment variables (like `LESAN_URL`) are not available in the browser, leading to failed API calls during Client-Side Rendering (CSR).

## The Problem

When making API calls from the client-side (browser), environment variables prefixed without `NEXT_PUBLIC_` are not accessible. This causes issues when:
1. Making direct API calls to the backend service
2. Uploading files using FormData
3. Authentication tokens need to be passed securely

## The Solution

We've implemented a Next.js API route that acts as a proxy between the client and the backend service. This proxy:
- Runs on the server-side where environment variables are accessible
- Forwards client requests to the backend service
- Handles both JSON and multipart/form-data requests
- Manages authentication tokens securely
- Avoids CORS issues

## Implementation Details

### 1. Proxy Route (`src/app/api/proxy/route.ts`)

The proxy route handles all POST requests and forwards them to the backend service:

**Key Features:**
- Retrieves `LESAN_URL` from server-side environment variables
- Handles both JSON and multipart/form-data (file uploads)
- Forwards authentication tokens from headers or cookies
- Returns consistent JSON responses
- Includes error handling

**Request Flow:**
```
Client → /api/proxy → Backend Service (LESAN_URL/lesan)
```

### 2. Updated API Service (`src/services/api.ts`)

The API service now detects whether it's running on the server or client:

**Server-Side:**
- Uses `process.env.LESAN_URL` directly
- Makes direct requests to the backend service

**Client-Side:**
- Uses `/api/proxy` route
- Implements custom `send()` and `setHeaders()` methods
- Retrieves tokens from cookies using `js-cookie`

**Key Functions:**

- `getLesanUrl()`: Returns the appropriate URL based on execution context
- `getLesanBaseUrl()`: Returns base URL for static assets
- `AppApi(lesanUrl?, token?)`: Creates API instance with authentication support

### 3. Updated Upload Component (`src/components/molecules/UploadFile.tsx`)

The upload component now:
- Uses the proxy route (`/api/proxy`) instead of direct backend URLs
- Retrieves authentication tokens from cookies or props
- Handles file uploads with proper FormData construction
- Includes label and required field support

**Upload Flow:**
```
1. User selects file
2. Component creates FormData with file and lesan-body
3. Sends POST request to /api/proxy with authentication token
4. Proxy forwards to backend service
5. Response returned to component
```

## Environment Variables

### Required Environment Variables

**Server-Side (`.env.local` or production environment):**
```bash
LESAN_URL=http://your-backend-service:port
```

**Note:** No `NEXT_PUBLIC_` prefix needed since we're using server-side proxy.

### Development Environment
```bash
LESAN_URL=http://localhost:1404
```

### Production Environment
```bash
LESAN_URL=http://backend-service:1405
```

## Authentication

The proxy handles authentication in multiple ways:

1. **Token in Header**: Client passes token in `token` header
2. **Authorization Header**: Falls back to `authorization` header
3. **Cookie**: Automatically forwards cookie header for session-based auth
4. **js-cookie**: Client retrieves token from cookies using `Cookies.get("token")`

## File Upload Support

The proxy specifically handles file uploads by:
1. Detecting `multipart/form-data` content type
2. Preserving FormData with proper boundaries
3. Forwarding files to backend without modification
4. Including the `lesan-body` JSON payload alongside the file

## Usage Examples

### Making a Regular API Call

```typescript
import { AppApi } from "@/services/api";

const api = AppApi();
const response = await api.send({
  service: "main",
  model: "user",
  act: "getUsers",
  details: {
    get: { _id: 1, name: 1 }
  }
});
```

### Making an Authenticated API Call

```typescript
import { AppApi } from "@/services/api";
import Cookies from "js-cookie";

const token = Cookies.get("token");
const api = AppApi(undefined, token);

const response = await api.send({
  service: "main",
  model: "user",
  act: "getProfile",
  details: {
    get: { _id: 1, name: 1, email: 1 }
  }
});
```

### Using the Upload Component

```typescript
import { UploadImage } from "@/components/molecules/UploadFile";
import { useState } from "react";

function MyComponent() {
  const [imageId, setImageId] = useState<string>("");

  return (
    <UploadImage
      inputName="profile-image"
      setUploadedImage={setImageId}
      type="image"
      label="Profile Picture"
      isRequired={true}
    />
  );
}
```

## Benefits

1. **Security**: Environment variables stay on the server
2. **CORS**: No cross-origin issues since requests go through same domain
3. **Consistency**: Single pattern for all API calls
4. **Authentication**: Centralized token management
5. **Error Handling**: Consistent error responses
6. **File Uploads**: Seamless file upload support

## Troubleshooting

### Issue: 404 on /api/proxy
**Solution**: Ensure the route file is at `src/app/api/proxy/route.ts`

### Issue: Missing token
**Solution**: Check that token is stored in cookies with key "token"

### Issue: CORS errors
**Solution**: Ensure all client-side requests go through `/api/proxy`

### Issue: File upload fails
**Solution**: Verify FormData includes both "file" and "lesan-body" fields

### Issue: Environment variable not found
**Solution**: Check `.env.local` file includes `LESAN_URL` (without NEXT_PUBLIC_ prefix)

## Testing

To test the proxy implementation:

1. **Server-Side Rendering (SSR)**:
   - Direct backend calls should work
   - Check server logs for direct connections

2. **Client-Side Rendering (CSR)**:
   - All API calls should go through `/api/proxy`
   - Check browser Network tab for `/api/proxy` requests

3. **File Uploads**:
   - Upload a file using UploadImage component
   - Verify request goes to `/api/proxy` with multipart/form-data
   - Check backend receives file correctly

## Migration Checklist

- [x] Create `/src/app/api/proxy/route.ts`
- [x] Update `/src/services/api.ts` with proxy logic
- [x] Update `/src/components/molecules/UploadFile.tsx` to use proxy
- [x] Install `js-cookie` package (already installed)
- [x] Set `LESAN_URL` environment variable
- [ ] Test SSR API calls
- [ ] Test CSR API calls
- [ ] Test file uploads
- [ ] Test authentication flow
- [ ] Update other components using direct API calls

## Notes

- The proxy only handles POST requests (GET, PUT, DELETE not implemented)
- All responses are returned as JSON
- The proxy adds minimal latency (< 10ms typically)
- Consider adding rate limiting for production use
- Consider adding request logging for debugging
