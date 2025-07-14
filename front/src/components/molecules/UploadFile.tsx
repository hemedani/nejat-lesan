import {
  isValidImageExtension,
  isValidPdfExtension,
  isValidGeoJsonExtension,
} from "@/utils/checkFileExtension";
import { getLesanBaseUrl } from "@/services/api";
import React, { useState } from "react";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface IUploadImage {
  setUploadedImage: (pic: string) => void;
  token?: string;
  inputName: string;
  type?: "video" | "image" | "doc" | "geo" | "json";
  filePath?: string;
}

export const UploadImage = ({
  token,
  inputName,
  setUploadedImage,
  type,
  filePath,
}: IUploadImage) => {
  const [isUploaded, setIsUploaded] = useState<"uploading" | boolean>(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      setIsUploaded(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploaded("uploading");

    const lesanBody = {
      service: "main",
      model: "file",
      act: "uploadFile",
      details: {
        get: { type: 1, _id: 1 },
        set: type ? { type } : {},
      },
    };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("lesan-body", JSON.stringify(lesanBody));

    try {
      const response = await fetch(`${getLesanBaseUrl()}/lesan`, {
        method: "POST",
        body: formData,
        headers: {
          token: token || "",
        },
      });
      const data = await response.json();

      if (data.success) {
        setUploadedImage(data.body._id); // اینجا باید _id برگشتی رو ست کنیم
        setIsUploaded(true);
      } else {
        console.error("Upload failed", data);
        setIsUploaded(false);
      }
    } catch (error) {
      console.error("Error uploading file", error);
      setIsUploaded(false);
    }
  };

  return (
    <div className="w-full p-4 border rounded-lg shadow-md flex flex-col items-center">
      <label
        htmlFor={inputName}
        className="w-full py-3 bg-gray-200 flex items-center justify-center rounded-lg cursor-pointer hover:bg-gray-300"
      >
        <input
          type="file"
          id={inputName}
          hidden
          onChange={handleFileChange}
          accept={
            type === "image"
              ? "image/jpeg,image/png,image/webp,image/jpg"
              : type === "doc"
                ? "application/pdf"
                : type === "geo"
                  ? ".geojson,.json,.geo,application/json,application/geo+json"
                  : type === "video"
                    ? "video/*"
                    : "*"
          }
        />
        انتخاب فایل
      </label>

      {file && file.type === "image/jpeg" ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border">
          <Image
            className="w-full h-full object-cover"
            src={URL.createObjectURL(file)}
            alt="Uploaded image preview"
            width={400}
            height={160}
          />
        </div>
      ) : file && file.type === "application/pdf" ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border">
          <embed
            className="w-full h-full object-cover"
            src={URL.createObjectURL(file)}
          />
        </div>
      ) : file &&
        (file.type === "application/json" ||
          file.type === "application/geo+json" ||
          file.name.toLowerCase().endsWith(".geojson")) ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm text-gray-600">فایل GeoJSON</p>
            <p className="text-xs text-gray-500">{file.name}</p>
          </div>
        </div>
      ) : filePath && isValidImageExtension(filePath) ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border">
          <Image
            className="w-full h-full object-cover"
            src={`${getLesanBaseUrl()}/uploads/images/${filePath}`}
            alt="Uploaded image preview"
            width={400}
            height={160}
          />
        </div>
      ) : filePath && isValidPdfExtension(filePath) ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border">
          <embed
            className="w-full h-full object-cover"
            src={`${getLesanBaseUrl()}/uploads/docs/${filePath}`}
          />
        </div>
      ) : filePath && isValidGeoJsonExtension(filePath) ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg
              className="w-16 h-16 mx-auto mb-2 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm text-gray-600">فایل GeoJSON</p>
            <p className="text-xs text-gray-500">{filePath}</p>
          </div>
        </div>
      ) : (
        ""
      )}

      {file && (
        <button
          onClick={handleUpload}
          className={`mt-4 w-full h-10 bg-blue-500 text-white rounded-lg transition-all duration-200 hover:shadow-md disabled:bg-gray-400`}
          disabled={isUploaded === "uploading" || isUploaded === true}
        >
          {isUploaded === "uploading"
            ? "در حال بارگذاری..."
            : isUploaded
              ? "بارگذاری موفق"
              : "بارگذاری"}
        </button>
      )}
    </div>
  );
};
