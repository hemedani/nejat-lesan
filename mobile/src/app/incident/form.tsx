import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';

import {
  fetchPatrolForm,
  fetchPatrolFormById,
  type PatrolForm,
  type PatrolFormResult,
  type ReferenceOption,
} from '@/api/form-definition';
import { translateApiError } from '@/api/errors';
import type { AnswerTree, ContentNode, FieldNode, FormDefinition } from '@forms';
import { isNodeVisible, resolveOptions, type ValidationResult } from '@forms';
import {
  addNestedRow,
  addRow,
  canLeavePage,
  issuesByNode,
  isDefinitionRenderable,
  mergeAnswers,
  normalizeDefinition,
  reachablePages,
  removeNestedRow,
  removeRow,
  seedCapturedAnswers,
  setFieldAnswer,
  setNestedRowAnswer,
  validateAll,
  validatePage,
} from '@/domain/form-state';
import { saveDraftFormData, requeueDraft } from '@/domain/draft-actions';
import { formAnswersToDraftData } from '@/domain/form-submission';
import {
  DEFAULT_ACCIDENT_FORM_ID,
  defaultAccidentFormPayload,
  isDefaultAccidentForm,
} from '@/domain/default-accident-form';
import { standardRouteFor } from '@/domain/form-routing';
import { incidentTypeOf } from '@/domain/incident-type';
import type { AccidentDraft } from '@/domain/types';
import { getDraft } from '@/storage/local-database';
import { getSyncWorker } from '@/services/sync-worker';
import { getConnectivitySnapshot } from '@/services/connectivity';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StepperHeader, type StepperStep } from '@/components/ui/stepper-header';
import { Banner } from '@/components/ui/banner';
import { ErrorText, FieldLabel, FormInput, ChipsRow } from '@/components/form-fields';
import { FormNode } from '@/components/form/form-node';
import { AppTheme } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

const AUTOSAVE_DEBOUNCE_MS = 500;

/** Validation result used before a definition has loaded. */
const NO_ISSUES: ValidationResult = { errors: [], warnings: [], blockedPages: [] };

type LoadState =
  | { phase: 'loading' }
  | { phase: 'empty' }
  | { phase: 'unsupported' }
  | { phase: 'error'; message: string }
  | { phase: 'ready' };

/**
 * Schema-driven incident form.
 *
 * Renders whatever the org's active `form_definition` says, using the shared
 * engine for visibility, requiredness, option narrowing and validation. Every
 * one of those decisions is made on-device with no network round-trip, because
 * offline must never disable incident creation or draft editing.
 *
 * When the org has published no form — or published one this build cannot render
 * — the screen reports that so the caller falls back to the built-in flows,
 * exactly as the legacy process wizard did.
 */
export default function IncidentFormScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const params = useLocalSearchParams<{ uuid?: string; definitionId?: string }>();
  const draftId = params.uuid ?? '';
  const definitionId = params.definitionId ?? '';

  const [load, setLoad] = useState<LoadState>({ phase: 'loading' });
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [form, setForm] = useState<PatrolForm | null>(null);
  const [formVersion, setFormVersion] = useState<number | undefined>(undefined);
  const [options, setOptions] = useState<Record<string, ReferenceOption[]>>({});
  const [answers, setAnswers] = useState<AnswerTree>({});
  const [draft, setDraft] = useState<AccidentDraft | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const dirty = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set once the draft has been merged in, so the focus re-seed can't race it. */
  const resumed = useRef(false);

  // --- load ---------------------------------------------------------------
  useEffect(() => {
    // `useRequiredSession` redirects while restoring, so a null session means the
    // screen is on its way out; fetching with it would throw on a null token.
    if (!session) return;
    let cancelled = false;

    (async () => {
      try {
        const existing = draftId ? await getDraft(draftId) : null;
        // Which collection the draft belongs to decides which kind of form to ask
        // for: an accident draft wants the accident form, everything else wants a
        // report form.
        const kind = existing && incidentTypeOf(existing) === 'accident'
          ? 'accident'
          : 'incident_report';

        // An explicit id is the officer's choice from the entry screen and wins
        // over "whatever is active": asking for the active form of a kind would
        // silently open a different form if another was activated in between.
        let payload: PatrolFormResult | ReturnType<typeof defaultAccidentFormPayload>;
        if (definitionId === DEFAULT_ACCIDENT_FORM_ID) {
          // The bundled form has no backend document, so there is nothing to fetch.
          payload = defaultAccidentFormPayload();
        } else if (definitionId) {
          payload = await fetchPatrolFormById(session, definitionId);
        } else {
          payload = await fetchPatrolForm(session, kind);
        }

        if (cancelled) return;

        // No accident form of the organization's own: fall back to the form bundled
        // with the app, so an unconfigured organization can still file a report.
        // This is also what makes a previously-opened form re-openable offline.
        if (!payload?.form && kind === 'accident') {
          payload = defaultAccidentFormPayload() as typeof payload;
        }

        const nextForm = payload?.form ?? null;
        if (!nextForm) {
          setLoad({ phase: 'empty' });
          return;
        }

        const normalized = normalizeDefinition(nextForm.definition);
        if (!isDefinitionRenderable(normalized, nextForm.schema_version)) {
          setLoad({ phase: 'unsupported' });
          return;
        }

        setForm(nextForm);
        setFormVersion(payload?.version?.version);
        setDefinition(normalized);
        // The bundled form resolves no reference options, so its `options` is an
        // empty object typed loosely; the stored form's is already the resolved
        // shape. Neither can hold a wrong entry, so one assertion covers both.
        setOptions((payload?.options ?? {}) as Record<string, ReferenceOption[]>);
        setLoad({ phase: 'ready' });
      } catch (cause) {
        if (cancelled) return;
        // Offline must never disable incident creation, so a transport failure
        // falls through to the built-in standard flow instead of dead-ending the
        // officer on a retry button.
        const connectivity = await getConnectivitySnapshot().catch(() => undefined);
        if (connectivity?.status === 'offline') {
          setLoad({ phase: 'empty' });
          return;
        }
        setLoad({ phase: 'error', message: translateApiError(cause) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftId, definitionId, session]);

  // --- resume the draft ---------------------------------------------------
  useEffect(() => {
    if (load.phase !== 'ready' || !draftId) return;
    let cancelled = false;

    (async () => {
      const record = await getDraft(draftId);
      if (cancelled || !record) return;
      setDraft(record);
      // Shallow-merge so a draft written by a newer build keeps its extra keys.
      const stored = (record.data ?? {}) as Record<string, unknown>;
      setAnswers((current) => {
        const merged = mergeAnswers(stored, current);
        // A `location` field is captured on the map screen, so its value comes
        // from the draft's coordinate column, not from the answers blob. Without
        // this the required location on the QA form's first page is
        // unsatisfiable and the officer can never reach step two.
        return definition
          ? seedCapturedAnswers(definition, merged, { location: record.incident_coords })
          : merged;
      });
      const savedPage = stored.form_page_index;
      if (typeof savedPage === 'number') setPageIndex(savedPage);
      resumed.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [load.phase, draftId, definition]);

  /**
   * Pick up a location captured after the form was already open.
   *
   * The map screen writes the point to the draft and pops back, so without this
   * "تغییر موقعیت" would appear to do nothing and the stale point would be
   * submitted. Only the captured fields are re-projected, so an in-progress
   * answer is never disturbed.
   *
   * Guarded on `resumed` because the initial load already seeded: re-running on
   * the first focus would be a redundant read and could race the merge above.
   */
  useFocusEffect(
    useCallback(() => {
      if (!resumed.current || !draftId || !definition) return;
      let cancelled = false;
      (async () => {
        const record = await getDraft(draftId);
        if (cancelled || !record) return;
        setDraft(record);
        setAnswers((current) =>
          seedCapturedAnswers(definition, current, { location: record.incident_coords }),
        );
      })();
      return () => {
        cancelled = true;
      };
    }, [draftId, definition]),
  );

  // --- autosave -----------------------------------------------------------
  const flush = useCallback(async () => {
    if (!draftId || !dirty.current) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setSaveState('saving');
    await saveDraftFormData(draftId, { form_answers: answers, form_page_index: pageIndex });
    dirty.current = false;
    setSaveState('saved');
  }, [draftId, answers, pageIndex]);

  // Auto-save on field change, page change, and before leaving the screen.
  useEffect(() => {
    if (load.phase !== 'ready' || !draftId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void flush();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [answers, pageIndex, load.phase, draftId, flush]);

  useEffect(() => {
    // A backgrounded or unmounted screen must not lose the last edit.
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (dirty.current && draftId) {
        void saveDraftFormData(draftId, { form_answers: answers, form_page_index: pageIndex });
      }
    };
  }, [answers, pageIndex, draftId]);

  const update = useCallback((next: AnswerTree) => {
    dirty.current = true;
    setAnswers(next);
  }, []);

  /**
   * Re-open the map screen for this draft.
   *
   * The screen pops back here on confirm and the focus effect re-projects the
   * new point, so the officer can correct the location without losing the page
   * they were on. The current point is passed so the map opens centred on it.
   */
  const editLocation = useCallback(() => {
    if (!draftId) return;
    const coords = draft?.incident_coords;
    router.push({
      pathname: '/incident/location',
      params: {
        uuid: draftId,
        ...(coords ? { lat: String(coords.latitude), lng: String(coords.longitude) } : {}),
      },
    });
  }, [draftId, draft, router]);

  /**
   * Hand the report to the built-in flow for its incident type.
   *
   * `openFormFor` only navigates here once it has seen a renderable form, so this
   * runs on the race where the org deactivates the form in between — and when a
   * previously captured form cannot be refetched offline. Either way the officer
   * must end up on a working form.
   */
  const openStandardFlow = useCallback(async () => {
    const stored = draftId ? await getDraft(draftId).catch(() => null) : null;
    const type = stored ? incidentTypeOf(stored) : 'accident';
    router.replace({
      pathname: standardRouteFor(type),
      params: { uuid: draftId },
    });
  }, [draftId, router]);

  // --- derived state ------------------------------------------------------
  // Every hook is above the render-state returns below: React requires the same
  // hook order on every render, and a `loading -> error` transition would
  // otherwise unmount the hooks underneath.
  const pages = useMemo(
    () => (definition ? reachablePages(definition, answers) : []),
    [definition, answers],
  );
  const page = pages[Math.min(pageIndex, Math.max(pages.length - 1, 0))];
  const lastPageIndex = pages.length - 1;

  const pageResult = useMemo(
    () => (definition && page ? validatePage(definition, answers, page.key) : null),
    [definition, answers, page],
  );
  const fullResult = useMemo(
    () => (definition ? validateAll(definition, answers) : NO_ISSUES),
    [definition, answers],
  );
  const grouped = useMemo(() => issuesByNode(pageResult ?? fullResult), [pageResult, fullResult]);

  // --- render states ------------------------------------------------------
  if (load.phase === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator color={AppTheme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (load.phase === 'empty' || load.phase === 'unsupported') {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState
          icon={'document-text-outline' as never}
          title={
            load.phase === 'empty'
              ? 'فرمی برای این رخداد تعریف نشده'
              : 'این فرم در نسخه فعلی قابل نمایش نیست'
          }
          description={
            load.phase === 'empty'
              ? 'از فرم استاندارد استفاده کنید.'
              : 'نسخه برنامه را به‌روزرسانی کنید یا از فرم استاندارد استفاده کنید.'
          }
          actionLabel="استفاده از فرم استاندارد"
          onAction={() => void openStandardFlow()}
        />
      </SafeAreaView>
    );
  }

  if (load.phase === 'error') {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState
          icon={'alert-circle-outline' as never}
          title="بارگذاری فرم ناموفق بود"
          description={load.message}
          actionLabel="تلاش دوباره"
          onAction={() => router.replace('/incident')}
        />
      </SafeAreaView>
    );
  }

  if (!definition || !form) return null;

  const warningsText = (pageResult?.warnings ?? [])
    .map((issue) => `• ${issue.message}`)
    .join('\n');

  const steps: StepperStep[] = pages.map((candidate) => ({
    key: candidate.key,
    label: candidate.title,
    // Page icons come from the definition's own vocabulary (`mapPin`, `sun`, …),
    // not from Ionicons. They used to be cast into `icon`, which made the stepper
    // log `"mapPin" is not a valid icon name for family "ionicons"` and draw
    // nothing; `formIcon` routes them through the shared form-icon renderer.
    formIcon: candidate.icon ?? null,
  }));

  if (!page) {
    return (
      <SafeAreaView style={styles.screen}>
        <EmptyState
          icon={'help-circle-outline' as never}
          title="هیچ مرحله‌ای نمایش داده نمی‌شود"
          description="شرط نمایش مراحل را بررسی کنید یا به مرحله قبل بازگردید."
          actionLabel="بازگشت"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const goNext = () => {
    // Only this page's blocking errors stop progress; a missing answer further
    // on is not this step's problem.
    if (pageResult && pageResult.errors.length > 0) return;
    if (pageIndex >= lastPageIndex) {
      void submit();
      return;
    }
    setPageIndex((current) => current + 1);
  };

  const submit = async () => {
    if (fullResult.errors.length > 0) {
      // Jump to the first page that still needs attention.
      const firstBlocked = pages.findIndex((candidate) =>
        fullResult.blockedPages.includes(candidate.key),
      );
      if (firstBlocked >= 0) setPageIndex(firstBlocked);
      return;
    }
    setSubmitting(true);
    try {
      await flush();
      // The draft rows are the submission. Map the answers onto the typed
      // `accident` keys and the `dynamic_answers` snapshot the sync worker reads,
      // then queue — without this the officer's answers stayed on the device.
      await saveDraftFormData(
        draftId,
        formAnswersToDraftData(definition, answers, {
          // The bundled form has no backend document, so it writes no
          // `form_definition_id`: an accident report does not need one, and the
          // report model derives its title from the form.
          ...(isDefaultAccidentForm(form._id) ? {} : { formId: form._id }),
          version: formVersion,
        }),
      );
      await requeueDraft(draftId);
      await getSyncWorker().run();
      router.replace('/drafts');
    } catch (cause) {
      setLoad({ phase: 'ready' });
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StepperHeader steps={steps} currentIndex={Math.min(pageIndex, lastPageIndex)} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>{form.name}</Text>
            <Text style={styles.saveState}>
              {saveState === 'saving'
                ? 'در حال ذخیره…'
                : saveState === 'saved'
                ? 'پیش‌نویس ذخیره شد'
                : ''}
            </Text>
          </View>

          {page.description ? <Text style={styles.description}>{page.description}</Text> : null}

          {pageResult && pageResult.warnings.length > 0 && (
            <Banner tone="warning" title="هشدار" message={warningsText} />
          )}

          {page.sections?.map((section) => (
            <View key={section.key} style={styles.card}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.nodes?.map((node) => (
                <FormNode
                  key={node.key}
                  node={node}
                  definition={definition}
                  answers={answers}
                  options={options}
                  errors={grouped.errors.get(node.key) ?? []}
                  warnings={grouped.warnings.get(node.key) ?? []}
                  onChange={(next) => update(next)}
                  onEditLocation={editLocation}
                />
              ))}
            </View>
          ))}

          {pageResult && pageResult.errors.length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                {pageResult.errors.length} مورد برای ادامه باید تکمیل شود
              </Text>
              {pageResult.errors.map((issue, index) => (
                <ErrorText key={index} text={issue.message} />
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="مرحله قبل"
            variant="outline"
            onPress={() => setPageIndex((current) => Math.max(0, current - 1))}
            disabled={pageIndex === 0}
            style={styles.footerButton}
          />
          <Button
            label={pageIndex >= lastPageIndex ? 'ثبت گزارش' : 'مرحله بعد'}
            onPress={goNext}
            loading={submitting}
            disabled={Boolean(pageResult && pageResult.errors.length > 0)}
            style={styles.footerButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AppTheme.colors.background },
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 17, fontWeight: '700', color: AppTheme.colors.textBody, textAlign: 'right' },
  saveState: { fontSize: 11, color: AppTheme.colors.textSecondary },
  description: { fontSize: 13, color: AppTheme.colors.textSecondary, textAlign: 'right' },
  card: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: AppTheme.colors.textBody, textAlign: 'right' },
  bannerLine: { fontSize: 12, color: AppTheme.colors.textBody, textAlign: 'right' },
  errorBox: { gap: 6, padding: 12, borderRadius: 12, backgroundColor: AppTheme.status.danger.bg },
  errorTitle: { fontSize: 13, fontWeight: '700', color: AppTheme.status.danger.text, textAlign: 'right' },
  footerButton: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.border,
    backgroundColor: AppTheme.colors.surface,
  },
});

export type { AnswerTree, ContentNode, FieldNode };