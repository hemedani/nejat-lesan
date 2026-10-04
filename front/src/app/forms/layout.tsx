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
				<div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
					<div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:3rem_3rem]" />
					<div className="relative">
						<FormAuthorHeader />
						<main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
							{children}
						</main>
					</div>
				</div>
			</PanelScopeProvider>
		</FormAuthorGuard>
	);
}
