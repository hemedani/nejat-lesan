"use client";

import { ScopedView } from "@/components/system/ScopedView";
import { FormBuilder } from "@/components/org/forms/FormBuilder";

export default function NewFormPage() {
	return (
		<ScopedView>{({ orgId }) => <FormBuilder orgId={orgId} />}</ScopedView>
	);
}
