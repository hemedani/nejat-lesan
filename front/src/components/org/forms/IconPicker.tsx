"use client";

import { useState } from "react";

import { FORM_ICON_GROUPS, type FormIconName } from "@forms";

import { FormIcon } from "./FormIcon";

/**
 * Icon picker for a form, a section, a question or an answer option.
 *
 * The choices come from `@forms`, so the builder can only offer an icon the backend
 * will accept at publish time and the phone will be able to draw.
 */
export function IconPicker({
	value,
	onChange,
	label = "آیکون",
	columns = 8,
}: {
	value?: string | null;
	onChange: (icon: FormIconName | undefined) => void;
	label?: string;
	columns?: number;
}) {
	const [open, setOpen] = useState(false);

	return (
		<div>
			<div className="mb-1 flex items-center gap-2">
				<span className="text-xs text-slate-400">{label}</span>
				<button
					type="button"
					onClick={() => setOpen((current) => !current)}
					className="rounded-lg border border-white/10 bg-white px-2 py-1 text-xs text-slate-300 transition hover:bg-white/[.04]"
				>
					{open ? "بستن" : "انتخاب آیکون"}
				</button>
				{value
					? (
						<span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
							<FormIcon name={value} size={14} />
							{value}
							<button
								type="button"
								aria-label="حذف آیکون"
								onClick={() => onChange(undefined)}
								className="text-rose-400 hover:underline"
							>
								×
							</button>
						</span>
					)
					: <span className="text-[11px] text-slate-500">بدون آیکون</span>}
			</div>

			{open
				? (
					<div className="max-h-64 space-y-3 overflow-auto rounded-lg border border-white/10 bg-slate-900 p-3">
						{FORM_ICON_GROUPS.map((group) => (
							<div key={group.key}>
								<p className="mb-1 text-[11px] font-bold text-slate-400">
									{group.label}
								</p>
								<div
									className="grid gap-1"
									style={{
										gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
									}}
								>
									{group.icons.map((icon) => (
										<button
											key={icon}
											type="button"
											title={icon}
											aria-label={icon}
											aria-pressed={value === icon}
											onClick={() => {
												onChange(icon);
												setOpen(false);
											}}
											className={`flex aspect-square items-center justify-center rounded-md border transition ${
												value === icon
													? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
													: "border-white/10 text-slate-400 hover:bg-white/[.04]"
											}`}
										>
											<FormIcon name={icon} size={18} />
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				)
				: null}
		</div>
	);
}
