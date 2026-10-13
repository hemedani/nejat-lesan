"use client";

import { useEffect, useState } from "react";
import { adminRecordRoutes } from "@/utils/admin-record-routes";
import { useRouter } from "next/navigation";

import { getOrganization } from "@/app/actions/organization/getOrganization";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { OrganizationListItem } from "@/services/org-projections";
import OrganizationForm from "@/components/org/OrganizationForm";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";

export function OrganizationDetailView({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = unwrapApiResponse<OrganizationListItem>(
          await getOrganization({ set: { _id: organizationId } }),
        );
        if (cancelled) return;
        if (!data) {
          setError("سازمان یافت نشد.");
          return;
        }
        setOrganization(data);
      } catch (cause) {
        if (!cancelled) setError(getPatrolErrorMessage(cause));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (loading) return <PageSkeleton />;
  if (error) return <RetryErrorBox message={error} onRetry={() => router.refresh()} />;

  return (
    <div>
      <button
        className="mb-4 text-sm text-slate-400 hover:text-white"
        onClick={() => router.push(adminRecordRoutes.orgs())}
        type="button"
      >
        → بازگشت به فهرست سازمان‌ها
      </button>
      <OrganizationForm organization={organization} />
    </div>
  );
}

export default OrganizationDetailView;
