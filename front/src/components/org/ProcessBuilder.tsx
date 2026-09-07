"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getAccidentProcess } from "@/app/actions/accident_process/getAccidentProcess";
import { addAccidentProcess } from "@/app/actions/accident_process/addProcess";
import { updateAccidentProcess } from "@/app/actions/accident_process/updateProcess";
import { activateAccidentProcess } from "@/app/actions/accident_process/activateProcess";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import { INCIDENT_TYPE_LABELS } from "@/utils/org";
import { Button } from "@/components/atoms/Button";
import MyInput from "@/components/atoms/MyInput";
import ToggleSwitch from "@/components/atoms/ToggleSwitch";
import { PageSkeleton, RetryErrorBox } from "@/components/patrol/ui";
import { OrgSelect } from "@/components/org/OrgSelect";
import { processToDraft, draftToPayload } from "@/components/org/process/process-payload";
import { INCIDENT_TYPES, newKey, type BuilderQuestion, type BuilderStep, type ProcessDraft } from "@/components/org/process/process-types";
import { QUESTION_MODEL_LABELS, QUESTION_MODEL_LOADERS, SUPPORTED_QUESTION_MODELS, type AnswerRow } from "@/components/org/process/answer-loader";

export function ProcessBuilder({ orgId, processId }: { orgId: string; processId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(processId ? true : false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [version, setVersion] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProcessDraft>(() => ({
    name: "",
    description: "",
    incident_type: undefined,
    steps: [],
  }));

  const [answers, setAnswers] = useState<Record<string, AnswerRow[]>>({});

  const load = useCallback(async () => {
    if (!processId) return;
    setLoading(true);
    setError(null);
    try {
      const process = unwrapApiResponse<{
        name: string;
        description?: string;
        incident_type?: string;
        status?: string;
        version?: number;
        steps?: never[];
      }>(await getAccidentProcess({ set: { _id: processId } }));
      setDraft(processToDraft(process as never));
      setStatus(process.status);
      setVersion(process.version);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [processId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ensureAnswers = async (modelName: string) => {
    if (answers[modelName] || !QUESTION_MODEL_LOADERS[modelName]) return;
    try {
      const rows = await QUESTION_MODEL_LOADERS[modelName]();
      setAnswers((prev) => ({ ...prev, [modelName]: rows }));
    } catch {
      setAnswers((prev) => ({ ...prev, [modelName]: [] }));
    }
  };

  const isActive = status === "active";
  const readOnly = isActive;

  const patchStep = (stepIndex: number, patch: Partial<BuilderStep>) => {
    setDraft((prev) => {
      const steps = prev.steps.map((step, i) => (i === stepIndex ? { ...step, ...patch } : step));
      return { ...prev, steps };
    });
  };

  const patchQuestion = (stepIndex: number, qIndex: number, patch: Partial<BuilderQuestion>) => {
    setDraft((prev) => {
      const steps = prev.steps.map((step, i) => {
        if (i !== stepIndex) return step;
        const questions = step.questions.map((q, j) => (j === qIndex ? { ...q, ...patch } : q));
        return { ...step, questions };
      });
      return { ...prev, steps };
    });
  };

  const save = async (activate: boolean) => {
    if (!draft.name.trim()) {
      toast.error("نام فرایند الزامی است.");
      return;
    }
    if (draft.steps.length === 0) {
      toast.error("حداقل یک گام اضافه کنید.");
      return;
    }
    for (const step of draft.steps) {
      if (!step.title.trim()) {
        toast.error("عنوان همه گام‌ها الزامی است.");
        return;
      }
      for (const q of step.questions) {
        if (!q.question.trim() || !q.model_name) {
          toast.error("پرسش‌ها باید متن و مدل پاسخ داشته باشند.");
          return;
        }
      }
    }
    setSaving(true);
    try {
      const payload = draftToPayload(draft);
      const saved = processId
        ? await updateAccidentProcess({ set: { _id: processId, ...payload } } as never)
        : await addAccidentProcess({ set: { ...payload, organizationId: orgId } } as never);
      if (!saved.success) {
        toast.error(((saved.body as { message?: string } | undefined)?.message) || "خطا در ذخیره‌سازی فرایند.");
        return;
      }
      const created = saved.body as { _id?: string } | undefined;
      const id = processId ?? created?._id;
      if (activate && id) {
        const act = await activateAccidentProcess({ set: { _id: id } });
        if (!act.success) {
          toast.error(((act.body as { message?: string } | undefined)?.message) || "خطا در فعال‌سازی فرایند.");
          router.replace(`/org/${orgId}/processes/${id}`);
          return;
        }
        toast.success("فرایند ذخیره و فعال شد.");
        router.replace(`/org/${orgId}/processes`);
        return;
      }
      toast.success(processId ? "فرایند به‌روزرسانی شد." : "فرایند به‌صورت پیش‌نویس ذخیره شد.");
      if (processId) {
        await load();
      } else {
        router.replace(`/org/${orgId}/processes`);
      }
    } catch (cause) {
      toast.error(getPatrolErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton blocks={[140, 320]} />;
  if (error) return <RetryErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-blue-300">سازنده فرایند</p>
          <h1 className="text-2xl font-bold text-white">{processId ? draft.name || "فرایند" : "فرایند جدید"}</h1>
          {version !== undefined && <p className="mt-1 text-xs text-slate-500">نسخه {version}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {processId && (
            <Link href={`/org/${orgId}/processes`} className="rounded-xl border border-white/15 bg-white/[.06] px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10">
              بازگشت
            </Link>
          )}
          {!readOnly && (
            <>
              <Button variant="secondary" onClick={() => void save(false)} loading={saving} disabled={saving}>
                ذخیره پیش‌نویس
              </Button>
              <Button onClick={() => void save(true)} loading={saving} disabled={saving}>
                ذخیره و فعال‌سازی
              </Button>
            </>
          )}
          {processId && status === "draft" && (
            <Button variant="warning" onClick={() => void save(true)} loading={saving} disabled={saving}>
              فعال‌سازی
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          این فرایند فعال است و قابل ویرایش نیست؛ برای تغییر، از نسخه‌ای تکراری یا پیش‌نویس استفاده کنید.
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <MyInput label="نام فرایند" value={draft.name} onValueChange={(v) => setDraft({ ...draft, name: v })} variant="dark" />
          <OrgSelect
            label="نوع رخداد"
            value={draft.incident_type || ""}
            onChange={(v) => setDraft({ ...draft, incident_type: (v || undefined) as ProcessDraft["incident_type"] })}
            options={[{ value: "", label: "بدون محدودیت نوع" }, ...INCIDENT_TYPES.map((t) => ({ value: t.value || "", label: t.label }))]}
            placeholder="(اختیاری)"
          />
        </div>
        <div className="mt-4">
          <MyInput label="توضیحات" type="textarea" value={draft.description || ""} onValueChange={(v) => setDraft({ ...draft, description: v })} variant="dark" />
        </div>
      </div>

      {draft.steps.map((step, i) => (
        <StepCard
          key={step.key}
          step={step}
          index={i}
          readOnly={readOnly}
          answers={answers}
          ensureAnswers={ensureAnswers}
          onStep={(patch) => patchStep(i, patch)}
          onQuestion={(qIndex, patch) => patchQuestion(i, qIndex, patch)}
          onMoveQuestion={(qIndex, dir) => moveQuestion(draft, setDraft, i, qIndex, dir)}
          onRemoveQuestion={(qIndex) => {
            setDraft((prev) => {
              const steps = prev.steps.map((s, si) =>
                si === i ? { ...s, questions: s.questions.filter((_, qi) => qi !== qIndex) } : s,
              );
              return { ...prev, steps };
            });
          }}
          onAddQuestion={() => {
            setDraft((prev) => {
              const steps = prev.steps.map((s, si) =>
                si === i
                  ? {
                      ...s,
                      questions: [
                        ...s.questions,
                        {
                          key: newKey(),
                          question: "",
                          description: "",
                          required: true,
                          model_name: SUPPORTED_QUESTION_MODELS[0],
                          multi_select: false,
                          allowed_answer_ids: [],
                        } as BuilderQuestion,
                      ],
                    }
                  : s,
              );
              return { ...prev, steps };
            });
          }}
          onMove={(dir) => moveStep(draft, setDraft, i, dir)}
          onRemove={() => {
            setDraft((prev) => ({ ...prev, steps: prev.steps.filter((_, si) => si !== i) }));
          }}
        />
      ))}

      {!readOnly && (
        <Button
          variant="secondary"
          fullWidth
          onClick={() =>
            setDraft((prev) => ({
              ...prev,
              steps: [...prev.steps, { key: newKey(), title: "", description: "", required: true, questions: [] } as BuilderStep],
            }))
          }
        >
          + افزودن گام
        </Button>
      )}

      {draft.incident_type && (
        <p className="text-xs text-slate-500">این فرایند برای رخداد «{INCIDENT_TYPE_LABELS[draft.incident_type]}» ساخته می‌شود.</p>
      )}
    </div>
  );
}

function moveStep(draft: ProcessDraft, setDraft: (d: ProcessDraft) => void, index: number, dir: -1 | 1) {
  const steps = [...draft.steps];
  const target = index + dir;
  if (target < 0 || target >= steps.length) return;
  [steps[index], steps[target]] = [steps[target], steps[index]];
  setDraft({ ...draft, steps });
}

function moveQuestion(
  draft: ProcessDraft,
  setDraft: (d: ProcessDraft) => void,
  stepIndex: number,
  qIndex: number,
  dir: -1 | 1,
) {
  const steps = draft.steps.map((step, i) => {
    if (i !== stepIndex) return step;
    const questions = [...step.questions];
    const target = qIndex + dir;
    if (target < 0 || target >= questions.length) return step;
    [questions[qIndex], questions[target]] = [questions[target], questions[qIndex]];
    return { ...step, questions };
  });
  setDraft({ ...draft, steps });
}

function StepCard({
  step,
  index,
  readOnly,
  answers,
  ensureAnswers,
  onStep,
  onQuestion,
  onAddQuestion,
  onRemoveQuestion,
  onMoveQuestion,
  onMove,
  onRemove,
}: {
  step: BuilderStep;
  index: number;
  readOnly: boolean;
  answers: Record<string, AnswerRow[]>;
  ensureAnswers: (modelName: string) => Promise<void>;
  onStep: (patch: Partial<BuilderStep>) => void;
  onQuestion: (qIndex: number, patch: Partial<BuilderQuestion>) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (qIndex: number) => void;
  onMoveQuestion: (qIndex: number, dir: -1 | 1) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/15 text-sm text-blue-200">{(index + 1).toLocaleString("fa-IR")}</span>
          <span className="text-sm font-semibold text-white">گام</span>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1">
            <button disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 disabled:opacity-30">↑</button>
            <button onClick={() => onMove(1)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300">↓</button>
            <button onClick={onRemove} className="rounded-lg border border-rose-400/20 px-2 py-1 text-xs text-rose-300 hover:bg-rose-400/10">حذف گام</button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <MyInput label="عنوان گام" value={step.title} onValueChange={(v) => onStep({ title: v })} variant="dark" />
        <div className="flex items-end gap-2 pb-2 text-xs text-slate-300">
          الزامی
          <ToggleSwitch checked={step.required} onChange={(v) => onStep({ required: v })} disabled={readOnly} />
        </div>
      </div>
      <div className="mt-3">
        <MyInput label="توضیح گام (اختیاری)" value={step.description || ""} onValueChange={(v) => onStep({ description: v })} variant="dark" />
      </div>

      <div className="mt-4 space-y-3">
        {step.questions.map((question, qIndex) => (
          <QuestionRow
            key={question.key}
            question={question}
            index={qIndex}
            readOnly={readOnly}
            rows={answers[question.model_name] || []}
            ensureAnswers={() => void ensureAnswers(question.model_name)}
            onChange={(patch) => onQuestion(qIndex, patch)}
            onRemove={() => onRemoveQuestion(qIndex)}
            onMove={(dir) => onMoveQuestion(qIndex, dir)}
          />
        ))}
        {!readOnly && (
          <Button size="sm" variant="secondary" onClick={onAddQuestion}>+ پرسش</Button>
        )}
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  index,
  readOnly,
  rows,
  ensureAnswers,
  onChange,
  onRemove,
  onMove,
}: {
  question: BuilderQuestion;
  index: number;
  readOnly: boolean;
  rows: AnswerRow[];
  ensureAnswers: () => void;
  onChange: (patch: Partial<BuilderQuestion>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  useEffect(() => {
    if (question.model_name) ensureAnswers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.model_name]);

  // allowed_answer_ids = «بازهٔ پاسخ‌های مجاز» است که در فرم موبایل نمایش داده می‌شود.
  // multi_select فقط تعیین می‌کند کاربر موبایل چند مورد از این بازه را می‌تواند انتخاب کند؛
  // بنابراین صرف‌نظر از حالت چند/تک‌انتخابی، ساخت بازه چندتایی مجاز است.
  const toggleAnswer = (id: string) => {
    const next = question.allowed_answer_ids.includes(id)
      ? question.allowed_answer_ids.filter((x) => x !== id)
      : [...question.allowed_answer_ids, id];
    onChange({ allowed_answer_ids: next });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[.02] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">پرسش {(index + 1).toLocaleString("fa-IR")}</span>
          {!readOnly && (
            <div className="flex items-center gap-1">
              <button disabled={index === 0} onClick={() => onMove(-1)} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-300 disabled:opacity-30">↑</button>
              <button onClick={() => onMove(1)} className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">↓</button>
            </div>
          )}
        </div>
        {!readOnly && (
          <button onClick={onRemove} className="text-xs text-rose-300 hover:text-rose-200">حذف پرسش</button>
        )}
      </div>

      <div className="mt-2 space-y-2">
        <MyInput label="متن پرسش" value={question.question} onValueChange={(v) => onChange({ question: v })} variant="dark" />
        <OrgSelect
          label="مدل پاسخ"
          value={question.model_name}
          onChange={(v) => onChange({ model_name: v, allowed_answer_ids: [] })}
          options={SUPPORTED_QUESTION_MODELS.map((m) => ({ value: m, label: QUESTION_MODEL_LABELS[m] || m }))}
          disabled={readOnly}
        />
        {question.model_name ? (
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              پرسش الزامی
              <ToggleSwitch checked={question.required} onChange={(v) => onChange({ required: v })} disabled={readOnly} />
            </div>
            <div className="flex items-center gap-2">
              چند انتخابی
              <ToggleSwitch checked={question.multi_select} onChange={(v) => onChange({ multi_select: v })} disabled={readOnly} />
            </div>
          </div>
        ) : null}
        <div>
          <p className="mb-1 text-xs text-slate-400">
            پاسخ‌های مجاز — چند گزینه از فهرست را علامت بزنید (کاربر موبایل در حالت «چند انتخابی» چند مورد و در «تک انتخابی» یک مورد از همین فهرست برمی‌گزیند)
          </p>
          {rows.length === 0 ? (
            <p className="text-[11px] text-slate-600">بارگذاری گزینه‌ها...</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-white/[.02] p-2">
              {rows.map((row) => {
                const checked = question.allowed_answer_ids.includes(row._id);
                return (
                  <label key={row._id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                    <input type="checkbox" className="accent-blue-500" disabled={readOnly} checked={checked} onChange={() => toggleAnswer(row._id)} />
                    {row.name}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
