"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import {
	getDefaultPanel,
	getRoleNames,
	isSuperViewer,
	type PanelViewer,
} from "@/utils/panels";
import type { RoleName, UserLevel } from "@/types/auth";

/**
 * Who may author an incident form.
 *
 * The builder writes `form_definition` documents, which the backend also gates —
 * this is the client-side half, so a deep link does not simply render the editor
 * for a role that could not save anything.
 */
const AUTHOR_LEVELS: UserLevel[] = ["Ghost", "Manager", "OrgHead", "UnitHead"];
const AUTHOR_ROLES: RoleName[] = ["OrgHead", "UnitHead"];

export function canAuthorForms(viewer: PanelViewer): boolean {
	if (isSuperViewer(viewer)) return true;
	if (AUTHOR_LEVELS.includes(viewer.level)) return true;
	const roles = getRoleNames(viewer.roles);
	return AUTHOR_ROLES.some((name) => roles.includes(name));
}

/**
 * Route guard for `/forms`.
 *
 * `/forms` sits outside the role panels because authoring is available to
 * OrgHead and UnitHead alike, and the two live in separate panels. PanelGuard
 * works on `PanelId`s, so this applies the same three rules — authenticated,
 * role may author, otherwise redirect to that viewer's own home panel.
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
