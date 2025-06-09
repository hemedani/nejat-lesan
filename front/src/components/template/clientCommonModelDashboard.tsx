/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import EntityCard from "../organisms/EntityCard";
import { DeleteModal } from "./DeleteModal";
import { useRouter } from "next/navigation";
import { ModelName, ToastNotify, translateModelNameToPersian } from "@/utils/helper";
import CreateUpdateModal from "./CreateUpdateModal";

interface TData {
  _id: string;
  name: string;
}

interface ClientDashboardProps {
  data: TData[];
  model: ModelName;
  remove: (_id: string, hardCascade: boolean) => Promise<any>
  add: (name: string) => Promise<any>
  update: (_id: string, name: string) => Promise<any>
}

const ClientCommonModelDashboard: React.FC<ClientDashboardProps> = ({ data, model, remove, add, update }) => {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<"edit" | "delete" | null>(
    null
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
        ToastNotify("success", `${translateModelNameToPersian(model)} با موفقیت حذف شد`);
      } else {
        ToastNotify("error", `مشکلی در حذف ${translateModelNameToPersian(model)} وجود دارد - ${removedItem.body.message}}`);
      }

      router.refresh();
    }
    closeModal();
  };

  return (
    <div>
      <button
        className="absolute top-1 left-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        onClick={() => openModal("edit")}
      >
        ایجاد {translateModelNameToPersian(model)} جدید
      </button>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((tag) => (
          <EntityCard
            key={tag._id}
            title={tag.name}
            onDelete={() => openModal("delete", tag)}
            onEdit={() => openModal("edit", tag)}
          />
        ))}
      </div>

      {activeModal === "edit" && (
        <CreateUpdateModal isOpen onClose={closeModal} itemToEdit={selectedItem} model={model} add={add} update={update} />
      )}

      {activeModal === "delete" && (
        <DeleteModal
          isVisible
          onConfirm={confirmDelete}
          onCancel={closeModal}
          message="آیا مطمئن هستید که می‌خواهید این برچسب را حذف کنید؟ این عمل قابل بازگشت نیست."
          isHardCascade={hardCascade}
          onHardCascadeChange={setHardCascade}
        />
      )}
    </div>
  );
};

export default ClientCommonModelDashboard;
