"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { FormList } from "@/components/org/forms/FormList";

export default function FormsPage() {
	return <ScopedView>{({ orgId }) => <FormList orgId={orgId} />}</ScopedView>;
}
