"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FormUpdateCityZone } from "./FormUpdateCityZone";
import { AppApi } from "@/services/api";
import { ToastNotify } from "@/utils/helper";
import { useScrollLock } from "@/hooks/useScrollLock";

interface CityZoneData {
  _id: string;
  name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
}

interface CityZoneUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityZoneId: string;
  token?: string;
  lesanUrl: string;
  onSuccessAction: () => void;
}

const CityZoneUpdateModal: React.FC<CityZoneUpdateModalProps> = ({
  isOpen,
  onClose,
  cityZoneId,
  token,
  lesanUrl,
  onSuccessAction,
}) => {
  const [cityZoneData, setCityZoneData] = useState<CityZoneData | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  const fetchCityZoneData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AppApi().send(
        {
          service: "main",
          model: "city_zone",
          act: "get",
          details: {
            set: {
              _id: cityZoneId,
            },
            get: {
              _id: 1,
              name: 1,
              population: 1,
              area: 1,
            },
          },
        },
        { token },
      );

      if (
        response.success &&
        response.body &&
        Array.isArray(response.body) &&
        response.body.length > 0
      ) {
        setCityZoneData(response.body[0]);
      } else {
        setError("منطقه شهری یافت نشد");
        ToastNotify("error", "خطا در بارگذاری اطلاعات منطقه شهری");
      }
    } catch (err) {
      setError("خطا در بارگذاری اطلاعات");
      ToastNotify("error", "خطا در بارگذاری اطلاعات منطقه شهری");
      console.error("Error fetching city zone data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cityZoneId, token]);

  // Fetch city zone data when modal opens
  useEffect(() => {
    if (isOpen && cityZoneId) {
      fetchCityZoneData();
    }
  }, [isOpen, cityZoneId, fetchCityZoneData]);

  const handleSuccess = () => {
    onSuccessAction();
    onClose();
  };

  const handleClose = () => {
    setCityZoneData(undefined);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto m-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-800">ویرایش منطقه شهری</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">
                  در حال بارگذاری اطلاعات منطقه شهری...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={fetchCityZoneData}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تلاش مجدد
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <FormUpdateCityZone
              token={token}
              lesanUrl={lesanUrl}
              cityZoneData={cityZoneData}
              onSuccessAction={handleSuccess}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default CityZoneUpdateModal;
