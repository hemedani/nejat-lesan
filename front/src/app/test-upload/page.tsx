"use client";

import { UploadImage } from "@/components/molecules/UploadFile";
import { AppApi } from "@/services/api";
import { useState } from "react";
import Cookies from "js-cookie";

export default function TestUploadPage() {
  const [uploadedImageId, setUploadedImageId] = useState<string>("");
  const [apiTestResult, setApiTestResult] = useState<string>("");
  const [isTestingApi, setIsTestingApi] = useState(false);

  const testApiCall = async () => {
    setIsTestingApi(true);
    setApiTestResult("Testing API...");

    try {
      const api = AppApi();

      const response = await api.send({
        service: "main",
        model: "file",
        act: "getFiles",
        details: {
          get: { _id: 1, type: 1 },
          set: {},
        },
      });

      setApiTestResult(`API Test Result:\n${JSON.stringify(response, null, 2)}`);
    } catch (error) {
      setApiTestResult(`API Test Error:\n${error}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Proxy Implementation Test Page</h1>
          <p className="text-gray-600">Test the proxy route for API calls and file uploads</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">1. API Call Test</h2>
          <p className="text-sm text-gray-600">Test a regular API call through the proxy route</p>
          <button
            onClick={testApiCall}
            disabled={isTestingApi}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isTestingApi ? "Testing..." : "Test API Call"}
          </button>

          {apiTestResult && (
            <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
              {apiTestResult}
            </pre>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">2. File Upload Test</h2>
          <p className="text-sm text-gray-600">Test file upload through the proxy route</p>

          <UploadImage
            inputName="test-upload"
            setUploadedImage={setUploadedImageId}
            type="image"
            label="Test Image Upload"
            isRequired={false}
          />

          {uploadedImageId && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">Upload Success!</p>
              <p className="text-sm text-green-600 mt-1">
                File ID: <code className="bg-green-100 px-2 py-1 rounded">{uploadedImageId}</code>
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">3. Document Upload Test</h2>
          <p className="text-sm text-gray-600">Test PDF document upload through the proxy route</p>

          <UploadImage
            inputName="test-doc-upload"
            setUploadedImage={(id) => console.log("Document uploaded:", id)}
            type="doc"
            label="Test Document Upload"
            isRequired={false}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">4. GeoJSON Upload Test</h2>
          <p className="text-sm text-gray-600">Test GeoJSON file upload through the proxy route</p>

          <UploadImage
            inputName="test-geo-upload"
            setUploadedImage={(id) => console.log("GeoJSON uploaded:", id)}
            type="geo"
            label="Test GeoJSON Upload"
            isRequired={false}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Testing Checklist</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Check browser console for any errors</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Verify requests go to /api/proxy in Network tab</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Ensure authentication token is passed correctly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Test with and without login token</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">✓</span>
              <span>Verify file uploads return valid file IDs</span>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Environment Check</h3>
          <div className="space-y-1 text-sm text-yellow-800">
            <p>
              <strong>Running on:</strong> {typeof window !== "undefined" ? "Client" : "Server"}
            </p>
            <p>
              <strong>Token present:</strong>{" "}
              {typeof window !== "undefined" && Cookies.get("token") ? "Yes" : "No"}
            </p>
            <p className="mt-2 text-xs text-yellow-700">
              Note: LESAN_URL should only be available server-side. Client requests go through
              /api/proxy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
