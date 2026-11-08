/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
import BatchDeleteByPeriodModal from "./BatchDeleteByPeriodModal";
import { href as attachmentHref } from "@/components/report/attachment-viewer";
import { formatNumber } from "@/utils/formatters";

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-canvas/50 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-sunken text-fg-faint">
        <svg
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.6}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
      </div>
      <p className="mt-4 text-sm font-semibold text-fg">
        تصادفی مطابق با فیلترها پیدا نشد
      </p>
      <p className="mt-1 text-xs text-fg-faint">
        عبارت جستجو یا فیلترهای فعال را تغییر دهید.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-xl border border-line-strong bg-surface px-4 py-2 text-xs font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
      >
        پاک کردن فیلترها
      </button>
    </div>
  );
}

interface AccidentDashboardProps {
  data: accidentSchema[];
  model: ModelName;
  remove: (_id: string, hardCascade: boolean) => Promise<any>;
  removeByCreatedAt: (data: {
    createdAt: number;
    hoursBefore?: number;
    hoursAfter?: number;
  }) => Promise<any>;
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
  removeByCreatedAt,
  add,
  update,
  totalCount,
  currentPage,
  pageSize,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const hasData = data.length > 0;
  const [activeModal, setActiveModal] = useState<
    "edit" | "delete" | "view" | "batchDelete" | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<accidentSchema | null>(null);
  const [hardCascade, setHardCascade] = useState<boolean>(false);
  // const [_viewMode, setViewMode] = useState<"card" | "table" | "map">("card");

  // Prevent background scrolling when view modal is open
  useScrollLock(activeModal === "view");

  const openModal = (
    type: "edit" | "delete" | "view" | "batchDelete",
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
    <div className="bg-surface rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-line">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-fg">
            لیست {translateModelNameToPersian(model)}
            <span className="mr-2 text-sm font-normal text-fg-muted">
              ({formatNumber(totalCount)} مورد)
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-fg transition-all duration-200 hover:bg-surface-hover"
              onClick={() => openModal("edit")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              ثبت سریع
            </button>
            <button
              className="flex items-center gap-2 rounded-xl border border-danger-border bg-danger-soft px-4 py-2 text-sm font-semibold text-danger-fg transition-all duration-200 hover:brightness-105"
              onClick={() => openModal("batchDelete")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              حذف دسته‌ای
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Tab.Group>
          <Tab.List className="flex space-x-4 space-x-reverse mt-6 border-b border-line">
            <Tab
              className={({ selected }) =>
                `px-4 py-2 text-sm font-medium border-b-2 ${
                  selected
                    ? "border-brand text-brand-fg"
                    : "border-transparent text-fg-muted hover:text-fg hover:border-line-strong"
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
                    ? "border-brand text-brand-fg"
                    : "border-transparent text-fg-muted hover:text-fg hover:border-line-strong"
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
                    ? "border-brand text-brand-fg"
                    : "border-transparent text-fg-muted hover:text-fg hover:border-line-strong"
                }`
              }
              // onClick={() => setViewMode("map")}
            >
              نمایش نقشه
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              {hasData ? (
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              ) : (
                <EmptyState onClear={() => router.push(pathname)} />
              )}
            </Tab.Panel>
            <Tab.Panel>
              {hasData ? (
                <AccidentTable
                  accidents={data}
                  onView={(accident) => openModal("view", accident)}
                  onEdit={(accident) => openModal("edit", accident)}
                  onDelete={(accident) => openModal("delete", accident)}
                />
              ) : (
                <EmptyState onClear={() => router.push(pathname)} />
              )}
            </Tab.Panel>
            <Tab.Panel>
              {hasData ? (
                <div className="mt-6 h-[500px]">
                  <AccidentMap
                    accidents={data}
                    onSelect={(accident) => openModal("view", accident)}
                  />
                </div>
              ) : (
                <EmptyState onClear={() => router.push(pathname)} />
              )}
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Pagination */}
      <div className="border-t border-line p-4">
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

      {activeModal === "batchDelete" && (
        <BatchDeleteByPeriodModal
          isVisible
          onClose={closeModal}
          removeByCreatedAt={removeByCreatedAt}
        />
      )}

      {activeModal === "view" && selectedItem && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-11/12 max-w-4xl overflow-y-auto rounded-2xl border border-line bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
                <h2 className="text-2xl font-bold text-fg">
                  جزئیات {translateModelNameToPersian(model)}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-fg-muted hover:text-fg"
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
                  <h3 className="mb-4 border-b border-line pb-2 text-lg font-semibold text-fg">
                    اطلاعات اصلی
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-fg-muted">شماره سریال:</span>
                      <span className="font-medium">
                        {selectedItem.serial || "نامشخص"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-fg-muted">تاریخ تصادف:</span>
                      <span className="font-medium">
                        {selectedItem.date_of_accident
                          ? converDate(selectedItem.date_of_accident.toString())
                          : "نامشخص"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-fg-muted">تعداد مجروحین:</span>
                      <span className="font-medium text-warning-fg">
                        {selectedItem.injured_count}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-fg-muted">تعداد فوتی‌ها:</span>
                      <span className="font-medium text-danger-fg">
                        {selectedItem.dead_count}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-fg-muted">شاهد:</span>
                      <span className="font-medium">
                        {selectedItem.has_witness ? "دارد" : "ندارد"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-fg-muted">نوع تصادف:</span>
                      <span className="font-medium">
                        {selectedItem.collision_type?.name || "نامشخص"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 border-b border-line pb-2 text-lg font-semibold text-fg">
                    موقعیت
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-fg-muted">استان:</span>
                      <span className="font-medium">
                        {selectedItem.province?.name || "نامشخص"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-fg-muted">شهر:</span>
                      <span className="font-medium">
                        {selectedItem.city?.name || "نامشخص"}
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-4 mt-6 border-b border-line pb-2 text-lg font-semibold text-fg">
                    خودروها
                  </h3>

                  <div className="space-y-4">
                    {selectedItem.vehicle_dtos &&
                    selectedItem.vehicle_dtos.length > 0 ? (
                      selectedItem.vehicle_dtos.map((vehicle, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-line bg-canvas p-3"
                        >
                          <div className="flex justify-between">
                            <span className="text-fg-muted">سیستم:</span>
                            <span className="font-medium">
                              {vehicle.system?.name || "نامشخص"}
                            </span>
                          </div>

                          <div className="flex justify-between mt-2">
                            <span className="text-fg-muted">راننده:</span>
                            <span className="font-medium">
                              {vehicle.driver
                                ? `${vehicle.driver.first_name} ${vehicle.driver.last_name}`
                                : "نامشخص"}
                            </span>
                          </div>

                          <div className="flex justify-between mt-2">
                            <span className="text-fg-muted">وضعیت تقصیر:</span>
                            <span className="font-medium">
                              {vehicle.fault_status?.name || "نامشخص"}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-fg-muted italic">
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
                    <h3 className="mb-4 border-b border-line pb-2 text-lg font-semibold text-fg">
                      پیوست‌ها
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedItem.attachments.map((attachment) => (
                        <div
                          key={attachment._id}
                          className="flex flex-col items-center rounded-lg border border-line p-3"
                        >
                          <div className="w-full h-24 bg-surface-sunken rounded flex items-center justify-center mb-2">
                            {attachment.type.startsWith("image/") ? (
                              <Image
                                src={attachmentHref(attachment)}
                                alt={attachment.name}
                                width={96}
                                height={96}
                                unoptimized
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-12 w-12 text-fg-faint"
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
                          <span className="text-sm text-fg-muted truncate w-full text-center">
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
                  className="tint-warning rounded-lg bg-tint-strong px-4 py-2 text-sm font-medium text-tint-fg transition-all duration-200 hover:brightness-110"
                >
                  ویرایش
                </button>
                <button
                  onClick={closeModal}
                  className="rounded-lg bg-surface-sunken px-4 py-2 text-sm font-medium text-fg transition-all duration-200 hover:bg-surface-hover"
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
