import { type ActFn, ObjectId } from "@deps";
import { accident_process, coreApp } from "../../../mod.ts";
import { getRegistryModel, QUESTION_REGISTRY } from "../questionRegistry.ts";
import type { MyContext } from "@lib";
import { assertOrgInActorScope, throwError } from "@lib";

/**
 * checkAnswerIds — بررسی اینکه allowed_answer_ids واقعاً رکوردهای همان مدل‌اند.
 * (helper داخلی، اکشن عمومی نیست.)
 */
export const checkAnswerIds = async (
	modelName: string,
	ids: Array<string | ObjectId>,
): Promise<boolean> => {
	const model = getRegistryModel(modelName);
	if (!model || !ids.length) return false;
	const found = await model.countDocument({
		filter: { _id: { $in: ids.map((id) => new ObjectId(id)) } },
	});
	return found === ids.length;
};

/** validateProcessStructure — قواعد فعال‌سازی (step/order/registry/whitelist). */
export const validateProcessStructure = async (
	steps: any[],
): Promise<void> => {
	if (!steps || steps.length === 0) {
		return throwError("فرآیند باید حداقل یک گام داشته باشد");
	}

	const sorted = [...steps].sort((a, b) => a.order - b.order);
	for (let i = 0; i < sorted.length; i++) {
		if (sorted[i].order !== i + 1) {
			return throwError("ترتیب گام‌ها باید ۱..N پیوسته باشد");
		}
		const questions = sorted[i].questions || [];
		const qSorted = [...questions].sort((a, b) => a.order - b.order);
		for (let j = 0; j < qSorted.length; j++) {
			if (qSorted[j].order !== j + 1) {
				return throwError(
					`ترتیب سؤال‌های گام «${
						sorted[i].title
					}» باید ۱..N پیوسته باشد`,
				);
			}
		}
	}

	for (const step of steps) {
		for (const q of step.questions || []) {
			const entry = QUESTION_REGISTRY[q.model_name];
			if (!entry) {
				return throwError(
					`مدل «${q.model_name}» در ریجستری سؤال‌ها ثبت نیست`,
				);
			}
			// سؤال مدل‌دار نباید target داینامیک داشته باشد (پاسخ باید typed برود).
			if (q.target?.kind === "dynamic") {
				return throwError(
					`سؤال «${q.question}» باید به فیلد typed نگاشت شود (نه dynamic)`,
				);
			}
			if (q.target?.kind !== entry.target.kind) {
				return throwError(
					`سؤال «${q.question}» target نامعتبر دارد (باید ${entry.target.kind})`,
				);
			}
			const allowed: any[] = q.allowed_answer_ids || [];
			if (allowed.length > 0) {
				const ok = await checkAnswerIds(q.model_name, allowed);
				if (!ok) {
					return throwError(
						`یک یا چند گزینه مجاز سؤال «${q.question}» در مدل «${q.model_name}» وجود ندارد`,
					);
				}
			} else {
				// whitelist خالی = همه رکوردها؛ اگر مدل اصلاً رکوردی ندارد نباید فعال شود
				const model = getRegistryModel(q.model_name);
				if (model) {
					const count = await model.countDocument({ filter: {} });
					if (count === 0) {
						return throwError(
							`مدل «${q.model_name}» رکوردی ندارد؛ گزینه‌ای برای سؤال «${q.question}» نیست`,
						);
					}
				}
			}
		}
	}
};

export const activateFn: ActFn = async (body) => {
	const {
		set: { _id },
	} = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const process = await accident_process.findOne({
		filters: { _id: new ObjectId(_id as string) },
		projection: {
			_id: 1,
			status: 1,
			version: 1,
			incident_type: 1,
			steps: 1,
			"organization._id": 1,
		},
	});
	if (!process) return throwError("فرآیند یافت نشد");
	if ((process as any).status === "active") {
		return throwError("فرآیند از قبل فعال است");
	}
	const actOrgId = (process as any).organization?._id as ObjectId | undefined;
	if (!actOrgId) return throwError("فرآیند سازمان معتبری ندارد");
	await assertOrgInActorScope(user, actOrgId.toString());

	await validateProcessStructure((process as any).steps || []);

	const orgId = (process as any).organization?._id as ObjectId | undefined;
	const incidentType = (process as any).incident_type as string | undefined;
	if (!orgId) return throwError("فرآیند سازمان معتبری ندارد");

	// فقط یک فعال به ازای (سازمان، نوع رخداد): قبلی را بایگانی می‌کنیم.
	const activeFilter: Record<string, any> = {
		"organization._id": orgId,
		_id: { $ne: new ObjectId(_id as string) },
		status: "active",
	};
	if (incidentType) {
		activeFilter.incident_type = incidentType;
	} else {
		activeFilter.incident_type = { $exists: false };
	}
	const existingActive = await accident_process.findOne({
		filters: activeFilter,
		projection: { _id: 1 },
	});
	if (existingActive) {
		const now = new Date();
		await accident_process.findOneAndUpdate({
			filter: { _id: existingActive._id as ObjectId },
			update: {
				$set: { status: "archived", is_active: false, updatedAt: now },
			},
			projection: { _id: 1 },
		});
	}

	const now = new Date();
	const nextVersion = ((process as any).version as number) + 1;
	const updated = await accident_process.findOneAndUpdate({
		filter: { _id: new ObjectId(_id as string) },
		update: {
			$set: {
				status: "active",
				is_active: true,
				version: nextVersion,
				updatedAt: now,
			},
		},
		projection: { _id: 1, status: 1, version: 1 },
	});

	return {
		success: true,
		status: updated?.status,
		version: updated?.version,
		message: `فرآیند فعال شد (نسخه ${nextVersion})`,
	};
};
