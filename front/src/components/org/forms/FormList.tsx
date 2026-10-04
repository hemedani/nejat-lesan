"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getFormDefinitions } from "@/app/actions/form_definition/gets";
import { duplicateFormDefinition } from "@/app/actions/form_definition/duplicate";
import { unwrapApiResponse } from "@/utils/api-response";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";
import type { FormDefinition } from "@forms";
import { FormIcon } from "./FormIcon";
import type { FormKind } from "./form-types";

interface FormListItem {
	_id: string;
	name: string;
	description?: string;
	status?: string;
	version?: number;
	/** Which model this form's answers are written into. */
	form_kind?: FormKind;
	icon?: string;
	definition?: FormDefinition;
	updatedAt?: string;
}

const KIND_LABELS: Record<FormKind, string> = {
	accident: "فرم تصادف",
	incident_report: "فرم رخداد",
};

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
	active: {
		label: "فعال",
		tone: "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
	},
	draft: {
		label: "پیش‌نویس",
		tone: "border border-amber-400/20 bg-amber-400/10 text-amber-100",
	},
	archived: {
		label: "بایگانی",
		tone: "border border-white/10 bg-white/[.04] text-slate-400",
	},
};

const countFields = (definition?: FormDefinition): number => {
	let total = 0;
	for (const page of definition?.pages ?? []) {
		for (const section of page.sections ?? []) {
			total += (section.nodes ?? []).length;
		}
	}
	return total;
};

/**
 * The organization's own forms.
 *
 * The backend scopes this read, so a manager browsing another organization sees
 * that organization's forms and nothing else.
 */
export function FormList({ orgId }: { orgId: string }) {
	const [rows, setRows] = useState<FormListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const load = useCallback(async () => {
		setLoading(true);
		setError("");
		try {
			const data = unwrapApiResponse<FormListItem[]>(
				await getFormDefinitions({
					set: { organizationId: orgId, page: 1, limit: 100 },
				}),
			);
			setRows(Array.isArray(data) ? data : []);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "دریافت فرم‌ها ناموفق بود");
		} finally {
			setLoading(false);
		}
	}, [orgId]);

	useEffect(() => {
		void load();
	}, [load]);

	const duplicate = useCallback(
		async (formId: string) => {
			try {
				const clone = unwrapApiResponse<FormListItem | null>(
					await duplicateFormDefinition({ set: { _id: formId } }),
				);
				if (!clone?._id) throw new Error("کپی فرم ناموفق بود");
				toast.success("کپی فرم ایجاد شد");
				await load();
			} catch (cause) {
				toast.error(
					cause instanceof Error ? cause.message : "کپی فرم ناموفق بود",
				);
			}
		},
		[load],
	);

	if (loading) return <PageSkeleton blocks={[80, 160, 160, 160]} />;
	if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2 className="text-sm font-bold text-white">
					فرم‌های این سازمان
					<span className="ms-2 text-xs font-normal text-slate-500">
						{rows.length} فرم
					</span>
				</h2>
				<Link href="/forms/new">
					<Button size="sm">ساخت فرم جدید</Button>
				</Link>
			</div>

			{rows.length === 0
				? (
					<div className="rounded-2xl border border-dashed border-white/15 bg-white/[.02] p-10 text-center text-sm text-slate-400">
						هنوز فرمی برای این سازمان تعریف نشده است. تا زمانی که فرمی نسازید، مأموران
						گشت گزارش را با فرم استاندارد ثبت می‌کنند.
					</div>
				)
				: (
					<ul className="flex flex-col gap-3">
						{rows.map((row) => {
							const status = STATUS_LABELS[row.status ?? "draft"] ??
								STATUS_LABELS.draft;
							return (
								<li
									key={row._id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 px-4 py-3 shadow-xl transition hover:border-blue-400/30"
								>
									<div className="flex flex-col gap-1">
										<div className="flex items-center gap-2">
											{/* The icon the author picked, drawn from the same shared
											    vocabulary the officer's phone uses. */}
											<FormIcon
												name={row.icon}
												size={18}
												className="text-slate-400"
											/>
											<Link
												href={`/forms/${row._id}`}
												className="text-sm font-bold text-white hover:text-blue-300"
											>
												{row.name}
											</Link>
											<span
												className={`rounded-full px-2 py-0.5 text-[10px] ${status.tone}`}
											>
												{status.label}
											</span>
											{row.status === "active" && (
												<span className="text-[10px] text-slate-500">
													نسخه {row.version}
												</span>
											)}
										</div>
										<p className="text-xs text-slate-500">
											{row.description || "بدون توضیح"} ·{" "}
											{KIND_LABELS[row.form_kind ?? "accident"]} ·{" "}
											{countFields(row.definition)} بخش
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="secondary"
											onClick={() => void duplicate(row._id)}
										>
											کپی
										</Button>
										<Link href={`/forms/${row._id}`}>
											<Button size="sm" variant="neutral">
												ویرایش
											</Button>
										</Link>
									</div>
								</li>
							);
						})}
					</ul>
				)}
		</div>
	);
}
