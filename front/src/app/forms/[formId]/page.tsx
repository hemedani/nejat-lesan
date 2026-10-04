"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { FormBuilder } from "@/components/org/forms/FormBuilder";

export default function FormDetailPage() {
	const params = useParams<{ formId: string }>();
	const formId = String(params?.formId ?? "");

	return (
		<ScopedView>
			{({ orgId }) => <FormBuilder orgId={orgId} formId={formId} />}
		</ScopedView>
	);
}
