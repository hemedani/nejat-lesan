import { translateLevel } from "@/utils/helper";
import { userSchema } from "@/types/declarations/selectInp";
import { EditIcon, UpdateIcon } from "@/components/atoms/Icons";
import Link from "next/link";

interface ProfileHeaderProps {
  user: userSchema;
  showAvatar?: boolean;
  pureEditLink: string;
  relationEditLink: string;
}

const ProfileHeader = ({
  user,
  showAvatar = true,
  pureEditLink,
  relationEditLink,
}: ProfileHeaderProps) => {
  return (
    <div className="relative bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600 p-8">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>

      {/* Avatar and Name Section */}
      <div className="relative flex flex-col items-center">
        {showAvatar && (
          <div className="relative mb-4">
            <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center text-white text-3xl font-bold shadow-lg transition-transform duration-300 hover:scale-105">
              {user.first_name?.[0] || "U"}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {user.first_name} {user.last_name}
        </h2>

        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full">
          <span className="text-white/90 text-sm font-medium">
            {translateLevel(user.level)}
          </span>
        </div>

        {/* Edit Buttons */}
        <div className="flex gap-3 mt-4">
          <Link
            href={pureEditLink}
            className="group flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
          >
            <UpdateIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">ویرایش اطلاعات اصلی</span>
          </Link>
          <Link
            href={relationEditLink}
            className="group flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-white hover:bg-white/20 transition-all duration-300"
          >
            <EditIcon className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
            <span className="text-sm font-medium">ویرایش روابط</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
