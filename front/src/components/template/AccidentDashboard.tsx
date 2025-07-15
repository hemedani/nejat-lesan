/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tab } from "@headlessui/react";
import Image from "next/image";
import {
  ModelName,
  ToastNotify,
  translateModelNameToPersian,
  converDate,
} from "@/utils/helper";
import AccidentCard from "../organisms/AccidentCard";
import { DeleteModal } from "./DeleteModal";
import Pagination from "../molecules/Pagination";
import AccidentTable from "../organisms/AccidentTable";
import AccidentMap from "../organisms/AccidentMap";
import CreateUpdateAccidentModal from "./CreateUpdateAccidentModal";
import { accidentSchema } from "@/types/declarations/selectInp";
import { useScrollLock } from "@/hooks/useScrollLock";

interface AccidentDashboardProps {
  data: accidentSchema[];
  model: ModelName;
  remove: (_id: string, hardCascade: boolean) => Promise<any>;
  add: (data: any) => Promise<any>;
  update: (_id: string, data: any) => Promise<any>;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

const AccidentDashboard: React.FC<AccidentDashboardProps> = ({
  data,
  model,
  remove,
  add,
  update,
  totalCount,
  currentPage,
  pageSize,
}) => {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<
    "edit" | "delete" | "view" | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<accidentSchema | null>(null);
  const [hardCascade, setHardCascade] = useState<boolean>(false);
  // const [_viewMode, setViewMode] = useState<"card" | "table" | "map">("card");

  // Prevent background scrolling when view modal is open
  useScrollLock(activeModal === "view");

  const openModal = (
    type: "edit" | "delete" | "view",
    item: accidentSchema | null = null,
  ) => {
    setSelectedItem(item);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
    setHardCascade(false);
  };

  const confirmDelete = async () => {
    if (selectedItem?._id) {
      const removedItem = await remove(selectedItem._id, hardCascade);

      if (removedItem.success) {
        ToastNotify(
          "success",
          `${translateModelNameToPersian(model)} با موفقیت حذف شد`,
        );
      } else {
        ToastNotify(
          "error",
          `مشکلی در حذف ${translateModelNameToPersian(model)} وجود دارد - ${
            removedItem.body.message
          }}`,
        );
      }

      router.refresh();
    }
    closeModal();
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            لیست {translateModelNameToPersian(model)}
            <span className="text-sm font-normal text-gray-500 mr-2">
              ({totalCount} مورد)
            </span>
          </h2>
          <div className="flex space-x-4 space-x-reverse">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center gap-2 shadow-sm"
              onClick={() => openModal("edit")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              ثبت {translateModelNameToPersian(model)} جدید
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-4 space-x-reverse mt-6 border-b">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${
                  selected
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
              // onClick={() => setViewMode("card")}
            >
              نمایش کارتی
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${
                  selected
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
              // onClick={() => setViewMode("table")}
            >
              نمایش جدولی
            </Tab>
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${
                  selected
                    ? "border-red-500 text-red-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`
              }
              // onClick={() => setViewMode("map")}
            >
              نمایش نقشه
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {data.map((accident) => (
                  <AccidentCard
                    key={accident._id}
                    accident={accident}
                    onView={() => openModal("view", accident)}
                    onEdit={() => openModal("edit", accident)}
                    onDelete={() => openModal("delete", accident)}
                  />
                ))}
              </div>
            </Tab.Panel>
            <Tab.Panel>
              <AccidentTable
                accidents={data}
                onView={(accident) => openModal("view", accident)}
                onEdit={(accident) => openModal("edit", accident)}
                onDelete={(accident) => openModal("delete", accident)}
              />
            </Tab.Panel>
            <Tab.Panel>
              <div className="h-[500px] mt-6">
                <AccidentMap
                  accidents={data}
                  onSelect={(accident) => openModal("view", accident)}
                />
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-200 p-4">
        <Pagination
          initialPage={currentPage}
          countPage={totalCount}
          limit={pageSize}
        />
      </div>

      {/* Modals */}
      {activeModal === "edit" && (
        <CreateUpdateAccidentModal
          isOpen
          onClose={closeModal}
          accidentToEdit={selectedItem}
          model={model}
          add={add}
          update={update}
        />
      )}

      {activeModal === "delete" && (
        <DeleteModal
          isVisible
          onConfirm={confirmDelete}
          onCancel={closeModal}
          message={`آیا مطمئن هستید که می‌خواهید این ${translateModelNameToPersian(
            model,
          )} را حذف کنید؟ این عمل قابل بازگشت نیست.`}
          isHardCascade={hardCascade}
          onHardCascadeChange={setHardCascade}
        />
      )}

      {activeModal === "view" && selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  جزئیات {translateModelNameToPersian(model)}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                    اطلاعات اصلی
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">شماره سریال:</span>
                      <span className="font-medium">
                        {selectedItem.serial || "نامشخص"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">تاریخ تصادف:</span>
                      <span className="font-medium">
                        {selectedItem.date_of_accident
                          ? converDate(selectedItem.date_of_accident.toString())
                          : "نامشخص"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">تعداد مجروحین:</span>
                      <span className="font-medium text-amber-600">
                        {selectedItem.injured_count}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">تعداد فوتی‌ها:</span>
                      <span className="font-medium text-red-600">
                        {selectedItem.dead_count}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">شاهد:</span>
                      <span className="font-medium">
                        {selectedItem.has_witness ? "دارد" : "ندارد"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">نوع تصادف:</span>
                      <span className="font-medium">
                        {selectedItem.collision_type?.name || "نامشخص"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                    موقعیت
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">استان:</span>
                      <span className="font-medium">
                        {selectedItem.province?.name || "نامشخص"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">شهر:</span>
                      <span className="font-medium">
                        {selectedItem.city?.name || "نامشخص"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mt-6 mb-4 text-gray-700 border-b pb-2">
                    خودروها
                  </h3>

                  <div className="space-y-4">
                    {selectedItem.vehicle_dtos &&
                    selectedItem.vehicle_dtos.length > 0 ? (
                      selectedItem.vehicle_dtos.map((vehicle, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex justify-between">
                            <span className="text-gray-600">سیستم:</span>
                            <span className="font-medium">
                              {vehicle.system?.name || "نامشخص"}
                            </span>
                          </div>

                          <div className="flex justify-between mt-2">
                            <span className="text-gray-600">راننده:</span>
                            <span className="font-medium">
                              {vehicle.driver
                                ? `${vehicle.driver.first_name} ${vehicle.driver.last_name}`
                                : "نامشخص"}
                            </span>
                          </div>

                          <div className="flex justify-between mt-2">
                            <span className="text-gray-600">وضعیت تقصیر:</span>
                            <span className="font-medium">
                              {vehicle.fault_status?.name || "نامشخص"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">
                        اطلاعات خودرو موجود نیست
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              {selectedItem.attachments &&
                selectedItem.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
                      پیوست‌ها
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedItem.attachments.map((attachment) => (
                        <div
                          key={attachment._id}
                          className="border rounded-lg p-3 flex flex-col items-center"
                        >
                          <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center mb-2">
                            {attachment.type.startsWith("image/") ? (
                              <Image
                                src={`/api/attachments/${attachment._id}`}
                                alt={attachment.name}
                                width={96}
                                height={96}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-gray-600 truncate w-full text-center">
                            {attachment.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="mt-8 flex justify-end space-x-4 space-x-reverse">
                <button
                  onClick={() => {
                    closeModal();
                    openModal("edit", selectedItem);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-200"
                >
                  ویرایش
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccidentDashboard;
