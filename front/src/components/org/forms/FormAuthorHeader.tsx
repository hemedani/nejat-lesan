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
		<header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
			<div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex items-center gap-3">
					<Link
						href={home}
						className="rounded-xl border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/10 hover:text-white"
					>
						بازگشت به پنل
					</Link>
					<div>
						<h1 className="text-sm font-bold text-white">فرم‌ساز پویا</h1>
						<p className="text-[11px] text-slate-500">
							هر فرم فقط در سازمان خودش ذخیره و به مأموران همان سازمان نمایش داده می‌شود.
						</p>
					</div>
				</div>

				{/* Ghost/Manager hold no org role, so they pick one to author into. */}
				{needsOrgSelection ? (
					<ScopePicker scopeKind="organization" />
				) : (
					<span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-200">
						{orgName ? `سازمان ${orgName}` : "سازمان"}
					</span>
				)}
			</div>
		</header>
	);
}
