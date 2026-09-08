import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fetchPatrolProcess, type PatrolProcess } from '@/api/accident-process';
import { translateApiError } from '@/api/errors';
import { getConnectivitySnapshot } from '@/services/connectivity';
import {
  emptyProcessState,
  isProcessRenderable,
  isSelected,
  optionsOf,
  processDataToState,
  processStateToData,
  selectSingle,
  setDynamicValue,
  toggleMulti,
  validateProcessStep,
  type ProcessErrors,
  type ProcessFormState,
} from '@/domain/process-form';
import { requeueDraft, saveDraftFormData } from '@/domain/draft-actions';
import { incidentTypeOf, INCIDENT_TYPE_LABEL } from '@/domain/incident-type';
import type { AccidentDraft } from '@/domain/types';
import { getDraft } from '@/storage/local-database';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusPill } from '@/components/ui/status-pill';
import { StepperHeader, type StepperStep } from '@/components/ui/stepper-header';
import {
  ChipsRow,
  ErrorText,
  FieldLabel,
  FormInput,
  HintRow,
  IdChips,
} from '@/components/form-fields';
import { AppTheme, Estedad } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

const AUTOSAVE_DEBOUNCE_MS = 500;

type LoadState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'unsupported' }
  | { phase: 'error'; message: string }
  | { phase: 'ready' };

function StandardFormLink({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return <Button fullWidth label={label} onPress={onPress} size="lg" style={styles.cta} />;
}

export default function ProcessWizardScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const params = useLocalSearchParams<{ uuid?: string }>();
  const uuid = typeof params.uuid === 'string' ? params.uuid : '';

  const [draft, setDraft] = useState<AccidentDraft | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({ phase: 'loading' });
  const [process, setProcess] = useState<PatrolProcess | null>(null);
  const [form, setForm] = useState<ProcessFormState | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<ProcessErrors>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const dirtyRef = useRef(false);
  const wasSyncedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProcess = useCallback(async () => {
    if (!session || !draft) {
      return;
    }
    setLoadState({ phase: 'loading' });
    try {
      const connectivity = await getConnectivitySnapshot();
      if (connectivity.status === 'offline') {
        setLoadState({ phase: 'error', message: 'بدون اینترنت؛ فرآیند ثبت سازمان بارگیری نشد.' });
        return;
      }
      const incidentType = incidentTypeOf(draft);
      const result = await fetchPatrolProcess(session, incidentType);
      const nextProcess = result.process;
      if (!nextProcess) {
        setLoadState({ phase: 'empty' });
        return;
      }
      if (!isProcessRenderable(nextProcess)) {
        setLoadState({ phase: 'unsupported' });
        return;
      }
      setProcess(nextProcess);
      setForm(
        processDataToState(nextProcess, draft.data ?? {}) ?? emptyProcessState(nextProcess),
      );
      wasSyncedRef.current = draft.sync_status === 'synced';
      setLoadState({ phase: 'ready' });
    } catch (error) {
      setLoadState({ phase: 'error', message: translateApiError(error) });
    }
  }, [session, draft]);

  useEffect(() => {
    let cancelled = false;
    if (!uuid || !session) {
      return;
    }
    getDraft(uuid)
      .then(existing => {
        if (cancelled) {
          return;
        }
        if (!existing || !existing.incident_coords) {
          setLoadState({
            phase: 'error',
            message: !existing ? 'پیش‌نویس یافت نشد.' : 'ابتدا محل واقعه را تأیید کنید.',
          });
          return;
        }
        setDraft(existing);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState({ phase: 'error', message: 'خواندن پیش‌نویس انجام نشد.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uuid, session]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProcess();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProcess]);

  const steps: StepperStep[] = useMemo(() => {
    if (!process) {
      return [];
    }
    return process.steps
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(step => ({ key: step.key, label: step.title, icon: 'clipboard-outline' as const }));
  }, [process]);

  const orderedSteps = useMemo(
    () => (process ? process.steps.slice().sort((a, b) => a.order - b.order) : []),
    [process],
  );

  function standardFormTarget(): { pathname: '/incident/details' | '/incident/simple' } {
    const type = draft ? incidentTypeOf(draft) : 'accident';
    return { pathname: type === 'accident' ? '/incident/details' : '/incident/simple' };
  }

  function openStandardForm() {
    const target = standardFormTarget();
    router.replace({ pathname: target.pathname, params: { uuid } });
  }

  useEffect(() => {
    if (!form || !dirtyRef.current || !uuid || !process) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setSaveState('saving');
    const data = processStateToData(form, process);
    saveTimerRef.current = setTimeout(() => {
      void saveDraftFormData(uuid, data)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [form, process, uuid]);

  function update(next: ProcessFormState) {
    dirtyRef.current = true;
    setSaveState('idle');
    setErrors({});
    setForm(next);
  }

  function flushSave(): Promise<void> {
    if (!form || !uuid || !process || !dirtyRef.current) {
      return Promise.resolve();
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    const data = processStateToData(form, process);
    return saveDraftFormData(uuid, data)
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('idle'));
  }

  function finishEditing(): Promise<void> {
    return flushSave()
      .catch(() => undefined)
      .then(() => {
        dirtyRef.current = false;
        if (wasSyncedRef.current) {
          return requeueDraft(uuid).catch(() => undefined);
        }
        return undefined;
      });
  }

  function goNext() {
    if (!form) {
      return;
    }
    const step = orderedSteps[stepIndex];
    if (!step) {
      return;
    }
    const stepErrors = validateProcessStep(step, form);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      return;
    }
    void flushSave().then(() => {
      if (stepIndex < orderedSteps.length - 1) {
        setErrors({});
        setStepIndex(stepIndex + 1);
      } else {
        void finishEditing().then(() => router.back());
      }
    });
  }

  function goBack() {
    void flushSave().then(() => {
      setErrors({});
      if (stepIndex > 0) {
        setStepIndex(stepIndex - 1);
      } else {
        dirtyRef.current = false;
        router.back();
      }
    });
  }

  if (!session || !uuid) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View />
      </SafeAreaView>
    );
  }

  if (loadState.phase === 'empty') {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          actionLabel="ادامه با فرم استاندارد"
          description={`سازمان شما فرآیند فعالی برای «${draft ? INCIDENT_TYPE_LABEL[incidentTypeOf(draft)] : 'این نوع'}» تعریف نکرده است؛ از فرم داخلی استفاده می‌شود.`}
          icon="clipboard-outline"
          onAction={openStandardForm}
          title="فرآیند فعالی یافت نشد"
        />
      </SafeAreaView>
    );
  }

  if (loadState.phase === 'unsupported') {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          actionLabel="ادامه با فرم استاندارد"
          description="این فرآیند شامل پرسش‌هایی است که در نسخه فعلی موبایل پشتیبانی نمی‌شود؛ از فرم داخلی استفاده می‌شود."
          icon="information-circle-outline"
          onAction={openStandardForm}
          title="فرآیند با فرم داخلی قابل انجام نیست"
        />
      </SafeAreaView>
    );
  }

  if (loadState.phase === 'error') {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          actionLabel="تلاش دوباره"
          description={loadState.message}
          icon="alert-circle"
          onAction={() => void loadProcess()}
          title="بارگیری فرآیند انجام نشد"
        />
        {draft ? <StandardFormLink label="ادامه با فرم استاندارد" onPress={openStandardForm} /> : null}
      </SafeAreaView>
    );
  }

  if (loadState.phase === 'loading' || !process || !form) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={AppTheme.colors.primary} />
      </SafeAreaView>
    );
  }

  const currentStep = orderedSteps[stepIndex];
  const isLastStep = stepIndex === orderedSteps.length - 1;
  const stepErrors = errors;

  function questionError(questionKey: string): string | undefined {
    return stepErrors[questionKey];
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.stepText}>
              {process.name}
              {process.incident_type ? ` · ${INCIDENT_TYPE_LABEL[process.incident_type]}` : ''}
            </Text>
            {saveState === 'saved' ? (
              <StatusPill icon="checkmark-circle" label="ذخیره شد" tone="success" style={styles.savePill} />
            ) : saveState === 'saving' ? (
              <StatusPill dot label="در حال ذخیره…" tone="info" style={styles.savePill} />
            ) : null}
          </View>
          {steps.length > 0 ? (
            <>
              <StepperHeader currentIndex={stepIndex} steps={steps} />
              <Text style={styles.title}>{currentStep?.title}</Text>
              {currentStep?.description ? (
                <Text style={styles.stepDescription}>{currentStep.description}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.title}>{currentStep?.title ?? process.name}</Text>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {currentStep.questions
            .slice()
            .sort((a, b) => a.order - b.order)
            .map(question => {
              const isDynamic = question.target.kind === 'dynamic';
              const answer = form.answers[question.key];
              const valueText = isDynamic ? answer?.value ?? '' : undefined;
              return (
                <View key={question.key} style={styles.questionBlock}>
                  <View style={styles.questionLabelRow}>
                    <FieldLabel text={question.question} />
                    {question.required ? (
                      <Text style={styles.requiredMark}>*</Text>
                    ) : null}
                  </View>
                  {question.description ? <HintRow text={question.description} /> : null}
                  {isDynamic ? (
                    <FormInput
                      hasError={Boolean(questionError(question.key))}
                      multiline
                      onChangeText={value => update(setDynamicValue(form, question.key, value))}
                      placeholder="متن پاسخ را وارد کنید…"
                      value={valueText ?? ''}
                    />
                  ) : question.multi_select ? (
                    optionsOf(question).length === 0 ? (
                      <HintRow text="گزینه‌ای برای انتخاب موجود نیست." />
                    ) : (
                      <ChipsRow
                        items={optionsOf(question).map(option => ({
                          key: option._id,
                          label: option.name,
                          onPress: () => update(toggleMulti(form, question.key, option._id)),
                          selected: isSelected(form, question.key, option._id),
                        }))}
                      />
                    )
                  ) : optionsOf(question).length === 0 ? (
                    <HintRow text="گزینه‌ای برای انتخاب موجود نیست." />
                  ) : (
                    <IdChips
                      options={optionsOf(question)}
                      onChange={id => update(selectSingle(form, question.key, id))}
                      value={answer?.optionIds?.[0]}
                    />
                  )}
                  {questionError(question.key) ? (
                    <ErrorText text={questionError(question.key) as string} />
                  ) : null}
                </View>
              );
            })}
        </ScrollView>

        <View style={styles.footer}>
          <Button label={stepIndex > 0 ? 'مرحله قبل' : 'بازگشت'} onPress={goBack} variant="outline" style={styles.secondaryButton} />
          <Button
            icon={isLastStep ? 'checkmark' : 'chevron-back'}
            label={isLastStep ? 'ثبت و پایان' : 'مرحله بعد'}
            onPress={goNext}
            style={styles.primaryButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: AppTheme.colors.background, flex: 1 },
  flex: { flex: 1 },
  centered: {
    alignItems: 'center',
    backgroundColor: AppTheme.colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: AppTheme.colors.surface,
    borderBottomColor: AppTheme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTop: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    minHeight: 26,
  },
  savePill: { alignSelf: 'flex-start' },
  stepText: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  title: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 19,
    lineHeight: 29,
    textAlign: 'right',
  },
  stepDescription: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'right',
  },
  content: { gap: 4, padding: 20, paddingBottom: 20 },
  questionBlock: { gap: 2, marginBottom: 18 },
  questionLabelRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 4,
  },
  requiredMark: {
    color: AppTheme.status.danger.text,
    fontFamily: Estedad.bold,
    fontSize: 15,
  },
  cta: { marginTop: 12 },
  footer: {
    backgroundColor: AppTheme.colors.surface,
    borderTopColor: AppTheme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row-reverse',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primaryButton: { flex: 2 },
  secondaryButton: { flex: 1 },
});
