import React from "react";
import { EditIcon, HideIcon, TrashIcon, UpdateIcon } from "@/components/atoms/Icons";
import { useRouter } from "next/navigation";

interface UserCardProps {
  id: string;
  first_name: string;
  last_name: string;
  national_number: string;
  onDelete: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  first_name,
  last_name,
  national_number,
  onDelete,
}) => {
  const router = useRouter();
  return (
    <div className="border w-full max-w-lg bg-white rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center gap-4">
      <div className="w-24 h-24 flex-shrink-0">
        <div className="w-full h-full bg-gradient-to-r from-blue-400 to-green-400 flex items-center justify-center rounded-full text-white text-2xl font-semibold">
          {first_name[0]} {last_name[0]}
        </div>
      </div>
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-gray-800">
          {first_name} {last_name}
        </h2>
        <p className="text-gray-600 text-sm mt-1">{national_number}</p>
      </div>
      <div className="flex flex-col gap-2">
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow"
            title="حذف"
          >
            <TrashIcon />
          </button>
        )}
        <button
          onClick={() => router.push(`/admin/users/edit/pure/${id}`)}
          className="p-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition-all duration-200 shadow"
          title="ویرایش"
        >
          <UpdateIcon />
        </button>
        <button
          onClick={() => router.push(`/admin/users/edit/relation/${id}`)}
          className="p-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition-all duration-200 shadow"
          title="ویرایش"
        >
          <EditIcon />
        </button>
        <button
          onClick={() => router.push(`/admin/users/user/${id}`)}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all duration-200 shadow"
          title="مشاهده جزئیات"
        >
          <HideIcon />
        </button>
      </div>
    </div>
  );
};

export default UserCard;
