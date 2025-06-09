import {
  isValidImageExtension,
  isValidPdfExtension,
} from "@/utils/checkFileExtension";
import React, { useState } from "react";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface IUploadImage {
  setUploadedImage: (pic: string) => void;
  token?: string;
  lesanUrl?: string;
  inputName: string;
  type?: "video" | "image" | "doc";
  filePath?: string;
}

export const UploadImage = ({
  token,
  lesanUrl,
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
      const response = await fetch(`${lesanUrl}/lesan`, {
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
        <input type="file" id={inputName} hidden onChange={handleFileChange} />
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
      ) : filePath && isValidImageExtension(filePath) ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border">
          <Image
            className="w-full h-full object-cover"
            src={`${lesanUrl}/uploads/images/${filePath}`}
            alt="Uploaded image preview"
            width={400}
            height={160}
          />
        </div>
      ) : filePath && isValidPdfExtension(filePath) ? (
        <div className="w-full h-40 mt-4 rounded-lg overflow-hidden border">
          <embed
            className="w-full h-full object-cover"
            src={`${lesanUrl}/uploads/docs/${filePath}`}
          />
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
