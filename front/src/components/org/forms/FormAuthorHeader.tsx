"use client";

import Link from "next/link";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { getDefaultPanel } from "@/utils/panels";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import { ScopePicker } from "@/components/system/ScopePicker";

/**
 * Chrome for `/forms`: which organization the forms belong to, and a way back
 * to whatever panel the viewer actually lives in.
 */
export function FormAuthorHeader() {
	const viewer = usePanelViewer();
	const { needsOrgSelection, orgName } = usePanelScope();
	const home = getDefaultPanel(viewer);

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
			<div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3">
					<Link
						href={home}
						className="rounded-xl border border-line bg-surface-hover px-3 py-1.5 text-xs text-fg transition hover:bg-surface-hover hover:text-fg"
					>
						بازگشت به پنل
					</Link>
					<div>
						<h1 className="text-sm font-bold text-fg">فرم‌ساز پویا</h1>
						<p className="text-[11px] text-fg-faint">
							هر فرم فقط در سازمان خودش ذخیره و به مأموران همان سازمان نمایش داده می‌شود.
						</p>
					</div>
				</div>

				{/* Ghost/Manager hold no org role, so they pick one to author into. */}
				{needsOrgSelection ? (
					<ScopePicker scopeKind="organization" />
				) : (
					<span className="tint-blue rounded-full border border-tint-border bg-tint-soft px-3 py-1.5 text-xs text-tint-fg">
						{orgName ? `سازمان ${orgName}` : "سازمان"}
					</span>
				)}
			</div>
		</header>
	);
}
