import { userSchema } from "@/types/declarations/selectInp";
import ProfileHeader from "./profile/ProfileHeader";
import PersonalInfo from "./profile/PersonalInfo";
import ContactInfo from "./profile/ContactInfo";
import SummarySection from "./profile/SummarySection";

interface UserProfileCardProps {
  user: userSchema;
  showAvatar?: boolean;
  className?: string;
  isAdminContext?: boolean;
}

const UserProfileCard = ({
  user,
  showAvatar = true,
  className = "",
  isAdminContext = false,
}: UserProfileCardProps) => {
  // Determine the edit links based on context
  const pureEditLink = isAdminContext
    ? `/admin/users/edit/pure/${user._id}`
    : "/user/edit/pure";
  const relationEditLink = isAdminContext
    ? `/admin/users/edit/relation/${user._id}`
    : "/user/edit/relation";

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}
    >
      {/* Header Section */}
      <ProfileHeader
        user={user}
        showAvatar={showAvatar}
        pureEditLink={pureEditLink}
        relationEditLink={relationEditLink}
      />

      {/* Content Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <PersonalInfo user={user} />

          {/* Contact Information */}
          <ContactInfo user={user} />

          {/* Summary Section */}
          <SummarySection user={user} />
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
