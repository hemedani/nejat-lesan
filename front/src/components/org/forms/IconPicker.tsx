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
				<span className="text-xs text-gray-600">{label}</span>
				<button
					type="button"
					onClick={() => setOpen((current) => !current)}
					className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 transition hover:bg-gray-50"
				>
					{open ? "بستن" : "انتخاب آیکون"}
				</button>
				{value
					? (
						<span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-700">
							<FormIcon name={value} size={14} />
							{value}
							<button
								type="button"
								aria-label="حذف آیکون"
								onClick={() => onChange(undefined)}
								className="text-red-600 hover:underline"
							>
								×
							</button>
						</span>
					)
					: <span className="text-[11px] text-gray-400">بدون آیکون</span>}
			</div>

			{open
				? (
					<div className="max-h-64 space-y-3 overflow-auto rounded-lg border border-gray-200 bg-white p-3">
						{FORM_ICON_GROUPS.map((group) => (
							<div key={group.key}>
								<p className="mb-1 text-[11px] font-bold text-gray-500">
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
													? "border-teal-600 bg-teal-50 text-teal-800"
													: "border-gray-200 text-gray-600 hover:bg-gray-50"
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
