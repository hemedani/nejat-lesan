/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import EntityCard from "../organisms/EntityCard";
import { DeleteModal } from "./DeleteModal";
import { useRouter } from "next/navigation";
import {
  ModelName,
  ToastNotify,
  translateModelNameToPersian,
} from "@/utils/helper";
import { TownshipUpdateModal } from "@/components/template";

interface TData {
  _id: string;
  name: string;
}

interface TownshipDashboardProps {
  data: TData[];
  model: ModelName;
  remove: (_id: string, hardCascade: boolean) => Promise<any>;
  token?: string;
  lesanUrl: string;
}

const TownshipDashboard: React.FC<TownshipDashboardProps> = ({
  data,
  model,
  remove,
  token,
  lesanUrl,
}) => {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<"edit" | "delete" | null>(
    null,
  );
  const [selectedItem, setSelectedItem] = useState<TData | null>(null);

  const [hardCascade, setHardCascade] = useState<boolean>(false);

  const openModal = (type: "edit" | "delete", item: TData | null = null) => {
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
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((item) => (
          <EntityCard
            key={item._id}
            title={item.name}
            onDelete={() => openModal("delete", item)}
            onEdit={() => openModal("edit", item)}
          />
        ))}
      </div>

      {activeModal === "edit" && selectedItem && (
        <TownshipUpdateModal
          isOpen
          onClose={closeModal}
          townshipId={selectedItem._id}
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

export default TownshipDashboard;
