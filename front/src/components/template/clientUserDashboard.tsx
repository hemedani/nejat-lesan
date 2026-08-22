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
  father_name: string;
  mobile: string;
  email?: string;
  gender: "Male" | "Female";
  personnel_number?: string;
  personnel_code?: string;
  national_number: string;
  level: "Ghost" | "Manager" | "Editor" | "Enterprise" | "Patrol";
  is_verified: boolean;
  summary?: string;
}

interface ClientDashboardProps {
  users: User[];
  searchQuery: string;
}

const ClientUserDashboard: React.FC<ClientDashboardProps> = ({ users }) => {
  const router = useRouter();

  const [activeModal, setActiveModal] = useState<"edit" | "delete" | null>(null);
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
    <div className="mt-5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold text-white">فهرست حساب‌ها</h2><p className="mt-1 text-xs text-slate-500">برای مشاهده جزئیات یا تغییر سطح دسترسی، کارت کاربر را انتخاب کنید.</p></div><Link href="/admin/users/createUser" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500">+ ایجاد کاربر جدید</Link></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {users?.map((user) => (
          <UserCard
            key={user._id}
            id={user._id}
            first_name={user.first_name}
            last_name={user.last_name}
            father_name={user.father_name}
            mobile={user.mobile}
            email={user.email}
            gender={user.gender}
            national_number={user.national_number}
            personnel_code={user.personnel_code}
            level={user.level}
            is_verified={user.is_verified}
            summary={user.summary}
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
