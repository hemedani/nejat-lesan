"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FormUpdateTownship } from "@/components/template";
import { AppApi } from "@/services/api";
import { ToastNotify } from "@/utils/helper";
import { useScrollLock } from "@/hooks/useScrollLock";

interface TownshipData {
  _id: string;
  name: string;
  english_name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  center_location: {
    type: "Point";
    coordinates: number[];
  };
}

interface TownshipUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  townshipId: string;
  token?: string;
  lesanUrl: string;
  onSuccessAction: () => void;
}

const TownshipUpdateModal: React.FC<TownshipUpdateModalProps> = ({
  isOpen,
  onClose,
  townshipId,
  token,
  lesanUrl,
  onSuccessAction,
}) => {
  const [townshipData, setTownshipData] = useState<TownshipData | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  const fetchTownshipData = useCallback(async () => {
    console.log("Fetching township data for ID:", townshipId);
    setIsLoading(true);
    setError(null);

    try {
      const response = await AppApi().send(
        {
          service: "main",
          model: "township",
          act: "get",
          details: {
            set: { _id: townshipId },
            get: {
              _id: 1,
              name: 1,
              english_name: 1,
              population: 1,
              area: 1,
              center_location: 1,
              province: {
                _id: 1,
                name: 1,
                english_name: 1,
              },
            },
          },
        },
        { token },
      );

      console.log("Township data response:", response);
      console.log("Response type:", typeof response);
      console.log("Response body type:", typeof response?.body);
      console.log("Response body:", response?.body);

      // Handle different response formats
      if (response && response.success) {
        let townshipItem = null;

        if (Array.isArray(response.body) && response.body.length > 0) {
          // Response is an array
          townshipItem = response.body[0];
          console.log("Using array format - township data:", townshipItem);
        } else if (
          response.body &&
          typeof response.body === "object" &&
          response.body._id
        ) {
          // Response is a direct object
          townshipItem = response.body;
          console.log("Using object format - township data:", townshipItem);
        }

        if (townshipItem) {
          console.log("Township data loaded successfully:", townshipItem);
          setTownshipData(townshipItem);
        } else {
          console.error("No valid township data found in response");
          setError("اطلاعات شهرستان در پاسخ سرور یافت نشد");
          ToastNotify("error", "اطلاعات شهرستان در پاسخ سرور یافت نشد");
        }
      } else {
        console.error("Failed to load township data:", response);
        setError("خطا در بارگذاری اطلاعات شهرستان");
        ToastNotify("error", "خطا در بارگذاری اطلاعات شهرستان");
      }
    } catch (err) {
      console.error("Error fetching township data:", err);
      setError("خطای غیرمنتظره در بارگذاری اطلاعات");
      ToastNotify("error", "خطای غیرمنتظره در بارگذاری اطلاعات");
    } finally {
      setIsLoading(false);
    }
  }, [townshipId, token]);

  useEffect(() => {
    if (isOpen && townshipId) {
      console.log("Modal opened, fetching township data...");
      fetchTownshipData();
    }
  }, [isOpen, townshipId, fetchTownshipData]);

  const handleUpdateSuccess = () => {
    onSuccessAction();
    onClose();
  };

  const handleClose = () => {
    setTownshipData(undefined);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">ویرایش شهرستان</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="بستن"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="mr-2 text-gray-600">در حال بارگذاری...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchTownshipData}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {townshipData && !isLoading && !error && (
            <FormUpdateTownship
              townshipData={townshipData}
              token={token}
              lesanUrl={lesanUrl}
              onSuccess={handleUpdateSuccess}
              onCancel={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TownshipUpdateModal;
