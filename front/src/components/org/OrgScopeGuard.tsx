"use client";

import { useEffect, useState } from "react";
import { getOrganizationModules } from "@/app/actions/organization/getModules";
import { useAuth } from "@/context/AuthContext";
import { PageSkeleton } from "@/components/patrol/ui";
import { ModuleGate } from "@/components/system/ModuleGate";

export function OrgScopeGuard({
  orgId,
  children,
}: {
  orgId: string;
  children: React.ReactNode;
}) {
  const { userLevel } = useAuth();
  const [effective, setEffective] = useState<string[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const response = await getOrganizationModules({ set: { organizationId: orgId } });
        if (!alive) return;
        if (response.success && Array.isArray(response.body?.effective)) {
          setEffective(response.body.effective as string[]);
        } else {
          setEffective([]);
        }
      } catch {
        if (alive) setEffective([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [orgId]);

  if (userLevel === "Ghost") return <>{children}</>;

  if (effective === null) return <PageSkeleton blocks={[120, 220]} />;

  return (
    <ModuleGate
      module="incident_patrol"
      enabled={effective.includes("incident_patrol")}
      message="ماژول ثبت و مدیریت رخداد (گشت) برای این سازمان فعال نیست. برای فعال‌سازی با مدیر نصب تماس بگیرید."
    >
      {children}
    </ModuleGate>
  );
}
