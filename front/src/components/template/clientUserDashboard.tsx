"use client";

import { useRouter } from "next/navigation";
import { DeleteModal } from "./DeleteModal";
import { useState } from "react";
import { deleteUser } from "@/app/actions/user/removeUser";
import { ToastNotify } from "@/utils/helper";
import Link from "next/link";
import UserCard from "@/components/organisms/user/UserCard";

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  personnel_number: string;
  national_number: string;
  level: string;
}

interface ClientDashboardProps {
  users: User[];
  searchQuery: string;
}

const ClientUserDashboard: React.FC<ClientDashboardProps> = ({ users }) => {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<"edit" | "delete" | null>(
    null
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // State for hard cascade
  const [isHardCascade, setIsHardCascade] = useState(false);

  const openModal = (type: "edit" | "delete", user: User | null = null) => {
    setSelectedUser(user);
    setActiveModal(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setActiveModal(null);
    setIsHardCascade(false); // Reset hard cascade
  };

  const handleDelete = async () => {
    if (!selectedUser?._id) return;

    try {
      await deleteUser(selectedUser._id, isHardCascade);
      ToastNotify("success", "کاربر با موفقیت حذف شد");
      router.refresh();
    } catch (error) {
      console.error("خطا در حذف کاربر:", error);
      alert("مشکلی در حذف کاربر به وجود آمده است.");
    } finally {
      closeModal();
    }
  };

  return (
    <div>
      <Link
        href="/admin/users/createUser"
        className="absolute top-1 left-5 mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
        ایجاد کاربر جدید
      </Link>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.map((user) => (
          <UserCard
            key={user._id}
            id={user._id}
            first_name={user.first_name}
            last_name={user.last_name}
            national_number={user.national_number}
            onDelete={() => openModal("delete", user)}
          />
        ))}
      </div>

      {activeModal === "delete" && (
        <DeleteModal
          isVisible
          onConfirm={handleDelete}
          onCancel={closeModal}
          message="آیا از حذف کاربر مطمئن هستید؟ این عمل قابل بازگشت نیست."
          isHardCascade={isHardCascade}
          onHardCascadeChange={setIsHardCascade}
        />
      )}
    </div>
  );
};

export default ClientUserDashboard;
