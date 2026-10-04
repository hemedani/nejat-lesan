"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { getDefaultPanel } from "@/utils/panels";
import { canAuthorForms } from "@/utils/form-access";

export { canAuthorForms } from "@/utils/form-access";

/**
 * Route guard for `/forms`.
 *
 * `/forms` sits outside the role panels because authoring is available to
 * OrgHead and UnitHead alike, and the two live in separate panels. PanelGuard
 * works on `PanelId`s, so this applies the same three rules — authenticated,
 * role may author *and* holds the `forms` module, otherwise redirect to that
 * viewer's own home panel.
 *
 * The access rule itself lives in `utils/form-access.ts` so the assertion
 * harness can verify it agrees with the nav entry that links here.
 */
export function FormAuthorGuard({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, authReady } = useAuth();
	const viewer = usePanelViewer();
	const router = useRouter();

	const allowed = canAuthorForms(viewer);
	const fallback = getDefaultPanel(viewer);

	useEffect(() => {
		if (!authReady) return;
		if (!isAuthenticated) {
			router.replace("/login");
			return;
		}
		if (!allowed) router.replace(fallback);
	}, [authReady, isAuthenticated, allowed, fallback, router]);

	if (!authReady || !isAuthenticated || !allowed) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-400/70 border-t-transparent" />
			</div>
		);
	}

	return <>{children}</>;
}