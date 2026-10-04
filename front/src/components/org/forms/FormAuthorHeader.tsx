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
		<header className="border-b border-gray-200 bg-white">
			<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div className="flex items-center gap-3">
					<Link
						href={home}
						className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
					>
						بازگشت به پنل
					</Link>
					<div>
						<h1 className="text-sm font-bold text-gray-800">فرم‌ساز پویا</h1>
						<p className="text-[11px] text-gray-500">
							هر فرم فقط در سازمان خودش ذخیره و به مأموران همان سازمان نمایش داده می‌شود.
						</p>
					</div>
				</div>

				{/* Ghost/Manager hold no org role, so they pick one to author into. */}
				{needsOrgSelection ? (
					<ScopePicker scopeKind="organization" />
				) : (
					<span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
						{orgName ? `سازمان ${orgName}` : "سازمان"}
					</span>
				)}
			</div>
		</header>
	);
}
