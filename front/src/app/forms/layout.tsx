"use client";

import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { FormAuthorGuard } from "@/components/org/forms/FormAuthorGuard";
import { FormAuthorHeader } from "@/components/org/forms/FormAuthorHeader";

/**
 * Dynamic incident-form authoring.
 *
 * Intentionally not nested under `/orghead` or `/unit-head`: both OrgHead and
 * UnitHead author forms, but they enter from different panels, so the shared
 * surface gets its own guard and scope provider instead of a duplicated route.
 */
export default function FormsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<FormAuthorGuard>
			<PanelScopeProvider prefer="organization">
				<div dir="rtl" className="min-h-screen bg-slate-100 text-gray-800">
					<FormAuthorHeader />
					<main className="mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
				</div>
			</PanelScopeProvider>
		</FormAuthorGuard>
	);
}
