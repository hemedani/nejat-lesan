/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { DeleteModal } from "./DeleteModal";
import { useRouter } from "next/navigation";
import {
  ModelName,
  ToastNotify,
  translateModelNameToPersian,
} from "@/utils/helper";
import EventCreateUpdateModal from "./EventCreateUpdateModal";
import { formatDateTimeRange } from "@/utils/date";

interface TData {
  _id: string;
  name: string;
  description: string;
  dates: Array<{
    from: string;
    to: string;
    startEntireRange: string;
    endEntireRange: string;
  }>; // Array of objects with individual and overall date ranges
}

interface EventDashboardProps {
  data: TData[];
  model: ModelName;
  remove: (_id: string, hardCascade: boolean) => Promise<any>;
  token?: string;
  lesanUrl: string;
}

const EventDashboard: React.FC<EventDashboardProps> = ({
  data,
  model,
  remove,
  token,
  lesanUrl,
}) => {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<
    "createUpdate" | "delete" | null
  >(null);
  const [selectedItem, setSelectedItem] = useState<TData | null>(null);

  const [hardCascade, setHardCascade] = useState<boolean>(false);

  const openModal = (
    type: "createUpdate" | "delete",
    item: TData | null = null,
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
          `مشکلی در حذف ${translateModelNameToPersian(model)} وجود دارد - ${removedItem.body.message}}`,
        );
      }

      router.refresh();
    }
    closeModal();
  };

  const handleUpdateSuccess = () => {
    router.refresh();
    closeModal();
  };

  return (
    <div>
      <button
        className="absolute top-1 left-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        onClick={() => openModal("createUpdate")}
      >
        ایجاد {translateModelNameToPersian(model)} جدید
      </button>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 border-b text-right">نام</th>
              <th className="py-3 px-4 border-b text-right">توضیحات</th>
              <th className="py-3 px-4 border-b text-right">بازه‌های تاریخی</th>
              <th className="py-3 px-4 border-b text-right">تاریخ ایجاد</th>
              <th className="py-3 px-4 border-b text-right">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((item) => {
              // Determine the overall start date for the event - use the earliest startEntireRange
              const overallStartDate =
                item.dates.length > 0
                  ? new Date(
                      Math.min(
                        ...item.dates.map((dateObj) =>
                          new Date(dateObj.startEntireRange).getTime(),
                        ),
                      ),
                    )
                  : new Date();

              return (
                <tr key={item._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-right">{item.name}</td>
                  <td
                    className="py-3 px-4 text-right max-w-xs truncate"
                    title={item.description}
                  >
                    {item.description}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.dates.length > 0 ? (
                      <div className="space-y-2">
                        {/* Individual date ranges with their respective overall ranges */}
                        <div>
                          <span className="text-sm text-gray-600">
                            بازه‌های فعال:
                          </span>
                          <ul className="list-disc pr-4 mt-1 space-y-2">
                            {item.dates.map((dateObj, idx) => {
                              const start = new Date(dateObj.from);
                              const end = new Date(dateObj.to);
                              const range = formatDateTimeRange(start, end);
                              return (
                                <li key={idx} className="text-sm text-gray-600">
                                  <div className="font-medium">{range}</div>
                                  <div className="text-xs text-gray-500">
                                    بازه کلی:{" "}
                                    {formatDateTimeRange(
                                      new Date(dateObj.startEntireRange),
                                      new Date(dateObj.endEntireRange),
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">بدون تاریخ</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {overallStartDate.toLocaleDateString("fa-IR")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex space-x-2 justify-end">
                      <button
                        onClick={() => openModal("createUpdate", item)}
                        className="text-blue-500 hover:text-blue-700"
                        title="ویرایش"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openModal("delete", item)}
                        className="text-red-500 hover:text-red-700"
                        title="حذف"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeModal === "createUpdate" && (
        <EventCreateUpdateModal
          isOpen
          onClose={closeModal}
          itemToEdit={selectedItem}
          model={model}
          token={token}
          lesanUrl={lesanUrl}
          onSuccessAction={handleUpdateSuccess}
        />
      )}

      {activeModal === "delete" && (
        <DeleteModal
          isVisible
          onConfirm={confirmDelete}
          onCancel={closeModal}
          message={`آیا مطمئن هستید که می‌خواهید این ${translateModelNameToPersian(model)} را حذف کنید؟ این عمل قابل بازگشت نیست.`}
          isHardCascade={hardCascade}
          onHardCascadeChange={setHardCascade}
        />
      )}
    </div>
  );
};

export default EventDashboard;
