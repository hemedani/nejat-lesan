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
				<span className="text-xs text-fg-muted">{label}</span>
				<button
					type="button"
					onClick={() => setOpen((current) => !current)}
					className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-fg-muted transition hover:bg-surface-sunken"
				>
					{open ? "بستن" : "انتخاب آیکون"}
				</button>
				{value
					? (
						<span className="inline-flex items-center gap-1 rounded-full bg-surface-sunken px-2 py-1 text-[11px] text-fg-muted">
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
					: <span className="text-[11px] text-fg-faint">بدون آیکون</span>}
			</div>

			{open
				? (
					<div className="max-h-64 space-y-3 overflow-auto rounded-lg border border-line bg-surface p-3">
						{FORM_ICON_GROUPS.map((group) => (
							<div key={group.key}>
								<p className="mb-1 text-[11px] font-bold text-fg-muted">
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
													? "tint-emerald border-tint-border bg-tint-soft text-tint-fg"
													: "border-line text-fg-muted hover:bg-surface-sunken"
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
