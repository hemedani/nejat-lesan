"use client";

import { useAuth } from "@/context/AuthContext";
import { RoleNotice } from "@/components/patrol/PatrolWorkspace";
import { PatrolOperations } from "@/components/patrol/PatrolOperations";

export default function PatrolOperationsPage() {
  const { userLevel } = useAuth();
  if (userLevel !== "Ghost" && userLevel !== "Manager") {
    return <RoleNotice message="مدیریت عملیات گشت فقط برای مدیران در دسترس است." />;
  }
  return <PatrolOperations />;
}
