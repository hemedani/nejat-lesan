"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccidentProcesses } from "@/app/actions/accident_process/getAccidentProcesses";
import { getAccidentProcess } from "@/app/actions/accident_process/getAccidentProcess";
import { unwrapApiResponse, getPatrolErrorMessage } from "@/utils/api-response";
import type { AccidentProcessListItem } from "@/services/org-projections";
import { INCIDENT_TYPE_LABELS } from "@/utils/org";
import { useOrgModules } from "@/hooks/useOrgModules";
import { PanelCard, PageSkeleton } from "@/components/patrol/ui";
import { Button } from "@/components/atoms/Button";
import { ModalShell } from "@/components/org/OrgSelect";

interface ProcessQuestion {
  key: string;
  question: string;
  description?: string;
  required: boolean;
  multi_select: boolean;
  model_name: string;
}

interface ProcessStep {
  key: string;
  title: string;
  description?: string;
  required: boolean;
  questions: ProcessQuestion[];
}

interface ProcessDetail {
  _id: string;
  name: string;
  description?: string;
  status: string;
  version: number;
  is_active: boolean;
  incident_type?: string;
  steps: ProcessStep[];
}

export function ProcessPreview({ orgId }: { orgId: string }) {
  const { has: orgHasModule } = useOrgModules(orgId);
  const [processes, setProcesses] = useState<AccidentProcessListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<ProcessDetail | null | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body = unwrapApiResponse<{ data: AccidentProcessListItem[]; totalCount: number }>(
        await getAccidentProcesses({ set: { organizationId: orgId, status: "active", limit: 10 } }),
      );
      setProcesses(Array.isArray(body?.data) ? body.data : []);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  // accident_process is licensed under incident_patrol — never surface the
  // process preview when the module is off for this org.
  if (!orgHasModule("incident_patrol")) return null;

  const openProcess = async (id: string) => {
    setViewing(undefined);
    try {
      const detail = unwrapApiResponse<ProcessDetail>(await getAccidentProcess({ set: { _id: id } }));
      setViewing(detail);
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
      setViewing(null);
    }
  };

  if (loading) return <PageSkeleton blocks={[120]} />;
  if (error) return null;
  if (processes.length === 0) return null;

  const questionCount = (steps: ProcessStep[] = []) => steps.reduce((sum, step) => sum + step.questions.length, 0);

  return (
    <>
      <PanelCard title="فرایندهای فعال ثبت رخداد" className="mb-5">
        <p className="mb-4 text-xs text-slate-500">فرایند پرسشنامه‌ای فعال برای ثبت رخداد در اپلیکیشن موبایل این آزادراه.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {processes.map((process) => (
            <div key={process._id} className="rounded-2xl border border-white/10 bg-white/[.02] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{process.name}</p>
                  {process.description && <p className="mt-1 text-xs leading-5 text-slate-500">{process.description}</p>}
                </div>
                {process.incident_type && (
                  <span className="shrink-0 rounded-full border border-blue-400/25 bg-blue-400/10 px-2.5 py-1 text-[10px] text-blue-200">
                    {INCIDENT_TYPE_LABELS[process.incident_type] || process.incident_type}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>نسخه {process.version}</span>
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">فعال</span>
              </div>
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => void openProcess(process._id)}>
                  مشاهده فرایند
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>

      {viewing !== undefined && (
        <ProcessModal process={viewing} stepQuestionCount={(steps) => questionCount(steps)} onClose={() => setViewing(undefined)} />
      )}
    </>
  );
}

function ProcessModal({
  process,
  stepQuestionCount,
  onClose,
}: {
  process: ProcessDetail | null;
  stepQuestionCount: (steps: ProcessStep[] | undefined) => number;
  onClose: () => void;
}) {
  return (
    <ModalShell title={process ? process.name : "فرایند"} onClose={onClose}>
      {process === null ? (
        <p className="text-sm text-rose-200">خطا در دریافت جزئیات فرایند.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1">نسخه {process.version}</span>
            {process.incident_type && (
              <span className="rounded-full border border-blue-400/25 bg-blue-400/10 px-2 py-1 text-blue-200">
                {INCIDENT_TYPE_LABELS[process.incident_type] || process.incident_type}
              </span>
            )}
            <span>{process.steps.length.toLocaleString("fa-IR")} گام</span>
            <span>{stepQuestionCount(process.steps).toLocaleString("fa-IR")} پرسش</span>
          </div>
          {process.description && <p className="text-sm leading-6 text-slate-400">{process.description}</p>}
          <div className="space-y-3">
            {process.steps.map((step, index) => (
              <div key={step.key} className="rounded-xl border border-white/10 bg-white/[.02] p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs text-blue-200">{(index + 1).toLocaleString("fa-IR")}</span>
                  <p className="font-medium text-slate-100">{step.title}</p>
                  {step.required && <span className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] text-blue-200">الزامی</span>}
                </div>
                {step.description && <p className="mt-1 pr-8 text-xs text-slate-500">{step.description}</p>}
                <div className="mt-2 space-y-1.5 pr-8">
                  {step.questions.map((question) => (
                    <p key={question.key} className="text-xs text-slate-400">
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-600 align-middle" />
                      {question.question}
                      {question.required && <span className="mr-1 text-rose-300">*</span>}
                      {question.multi_select && <span className="mr-1 text-[10px] text-slate-600">(چند انتخابی)</span>}
                    </p>
                  ))}
                  {step.questions.length === 0 && <p className="text-xs text-slate-600">بدون پرسش</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  );
}
