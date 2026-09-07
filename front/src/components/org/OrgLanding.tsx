"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getUnit } from "@/app/actions/unit/getUnit";
import { unwrapApiResponse } from "@/utils/api-response";
import { PageSkeleton } from "@/components/patrol/ui";

/**
 * ورود به فضای سازمان:
 * - سرپرست سازمان (OrgHead با scope سازمان) → /org/{orgId}
 * - سرپرست واحد (UnitHead با scope واحد) → /org/{سازمان همان واحد}
 * - مدیر/گوست بدون نقش سازمانی → /admin/org (مدیریت چندسازمانی)
 */
export function OrgLanding() {
  const { isAuthenticated, userLevel, isOrgLeader, primaryOrgRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const manager = userLevel === "Ghost" || userLevel === "Manager";
    if (!isOrgLeader) {
      router.replace(manager ? "/admin/org" : "/");
      return;
    }
    const role = primaryOrgRole;
    if (!role?.scopeId) {
      router.replace(manager ? "/admin/org" : "/");
      return;
    }
    if (role.scopeType === "organization") {
      router.replace(`/org/${role.scopeId}`);
      return;
    }
    if (role.scopeType === "unit") {
      void (async () => {
        try {
          const unit = unwrapApiResponse<{ organization?: { _id?: string } }>(
            await getUnit({ set: { _id: role.scopeId as string } }),
          );
          const orgId = unit?.organization?._id;
          router.replace(orgId ? `/org/${orgId}` : "/");
        } catch {
          router.replace("/");
        }
      })();
    }
  }, [isAuthenticated, userLevel, isOrgLeader, primaryOrgRole, router]);

  return <PageSkeleton blocks={[220, 260]} />;
}
