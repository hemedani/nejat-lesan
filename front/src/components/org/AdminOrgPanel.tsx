"use client";

import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { OrgIndexView } from "@/components/org/OrgIndexView";

export function AdminOrgPanel() {
  const { userLevel } = useAuth();
  if (userLevel !== "Ghost" && userLevel !== "Manager") {
    return <RoleNotice message="مدیریت سازمان‌ها فقط برای مدیران سیستم در دسترس است." />;
  }
  return <OrgIndexView />;
}
