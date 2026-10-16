import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadReferenceSet, type ReferenceSet } from '@/api/references';
import {
  readSimpleFormState,
  validateSimpleForm,
  type SimpleIncidentErrors,
  type SimpleIncidentFormState,
} from '@/domain/simple-incident-form';
import { incidentTypeOf, INCIDENT_TYPE_LABEL } from '@/domain/incident-type';
import { requeueDraft, saveSimpleFormState } from '@/domain/draft-actions';
import type { AccidentDraft } from '@/domain/types';
import { getDraft } from '@/storage/local-database';
import { formatCoordinate } from '@/domain/location-utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusPill } from '@/components/ui/status-pill';
import { SectionHeader } from '@/components/ui/section-header';
import {
  BoolChips,
  ChipsRow,
  ErrorText,
  FieldLabel,
  FormInput,
  HintRow,
  IdChips,
} from '@/components/form-fields';
import { AppIcons } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';
import { UploadModal } from '@/components/upload-modal';
import { useReportUpload } from '@/hooks/use-report-upload';

const AUTOSAVE_DEBOUNCE_MS = 500;

const NEEDED_REFERENCE_MODELS = [
  'incident_severity',
  'road_defect',
  'equipment_damage',
  'position',
] as const;

function MultiChips({
  options,
  values,
  onChange,
}: {
  options: { _id: string; name: string }[];
  values: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter(v => v !== id) : [...values, id]);
  }
  if (options.length === 0) {
    return <HintRow text="در حال بارگیری فهرست…" />;
  }
  return (
    <ChipsRow
      items={options.map(option => ({
        key: option._id,
        label: option.name,
        onPress: () => toggle(option._id),
        selected: values.includes(option._id),
      }))}
    />
  );
}

export default function SimpleIncidentScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const params = useLocalSearchParams<{ uuid?: string }>();
  const uuid = typeof params.uuid === 'string' ? params.uuid : '';

  const upload = useReportUpload();

  const [draft, setDraft] = useState<AccidentDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<SimpleIncidentFormState | null>(null);
  const [refs, setRefs] = useState<ReferenceSet | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [errors, setErrors] = useState<SimpleIncidentErrors>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const loadedRef = useRef(false);
  const wasSyncedRef = useRef(false);
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!uuid || !session) {
        return;
      }
      getDraft(uuid)
        .then(existing => {
          if (cancelled) {
            return;
          }
          if (!existing) {
            setLoadError('پیش‌نویس یافت نشد.');
            return;
          }
          if (!existing.incident_coords) {
            setLoadError('ابتدا محل واقعه را تأیید کنید.');
            return;
          }
          setDraft(existing);
          if (!loadedRef.current) {
            loadedRef.current = true;
            wasSyncedRef.current = existing.sync_status === 'synced';
            setForm(readSimpleFormState(existing));
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError('خواندن پیش‌نویس انجام نشد.');
          }
        });
      return () => {
        cancelled = true;
      };
    }, [uuid, session]),
  );

  const loadRefs = useCallback(() => {
    if (!session || !draft) {
      return;
    }
    loadReferenceSet(session, [...NEEDED_REFERENCE_MODELS])
      .then(loaded => {
        setRefs(loaded);
        setRefError(null);
      })
      .catch(() => {
        setRefError('بارگیری فهرست‌ها انجام نشد؛ پس از اتصال دوباره تلاش کنید.');
      });
  }, [session, draft]);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    if (!form || !dirtyRef.current || !uuid) {
      return;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    setSaveState('saving');
    saveTimerRef.current = setTimeout(() => {
      void saveSimpleFormState(uuid, form)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [form, uuid]);

  function update(patch: Partial<SimpleIncidentFormState>) {
    dirtyRef.current = true;
    setSaveState('idle');
    setErrors({});
    setForm(previous => (previous ? { ...previous, ...patch } : previous));
  }

  function flushSave(): Promise<void> {
    if (!form || !uuid || !dirtyRef.current) {
      return Promise.resolve();
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    return saveSimpleFormState(uuid, form)
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('idle'));
  }

  /**
   * Flush the form and leave without sending.
   *
   * A correction is still requeued here, so edits the officer made to a report that
   * already reached the server are not lost just because they backed out of the editor.
   * A report the server has never seen is left as a draft — abandoning is not filing.
   */
  async function finishEditing(): Promise<void> {
    await flushSave().catch(() => undefined);
    dirtyRef.current = false;
    if (wasSyncedRef.current) {
      await requeueDraft(uuid).catch(() => undefined);
    }
  }

  /**
   * The officer pressed submit: flush, then hand the report to the upload flow, which
   * queues it and puts the upload modal in front of them.
   *
   * This used to requeue only when the report had already reached the server — a
   * correction, so that `accident.update` would carry the edits. But a *new* report starts
   * its queue record at `draft`, and the worker only ever processes `queued`, so finishing
   * a brand-new report left it in the drafts list with nothing that would ever send it.
   * The dynamic form was the only surface that requeued, which is why the gap went
   * unnoticed: it read as a deliberate difference between the wizards.
   */
  async function submitReport(): Promise<void> {
    await flushSave().catch(() => undefined);
    dirtyRef.current = false;
    await upload.send([uuid]);
  }

  function submit() {
    if (!form) {
      return;
    }
    const phaseErrors = validateSimpleForm(form);
    setErrors(phaseErrors);
    if (Object.keys(phaseErrors).length > 0) {
      return;
    }
    // `submitReport` flushes before it queues, so the answers cannot be lost between
    // the save and the send.
    void submitReport();
  }

  function goBack() {
    // Same abandon path as the wizards: flush, and requeue if this was a correction to a
    // report the server already has, so backing out never silently discards the edit.
    void finishEditing().then(() => router.back());
  }

  function editLocation() {
    if (!draft?.incident_coords) {
      return;
    }
    router.push({
      pathname: '/incident/location',
      params: {
        uuid: draft.client_report_uuid,
        lat: String(draft.incident_coords.latitude),
        lng: String(draft.incident_coords.longitude),
      },
    });
  }

  if (!session || !draft || !form) {
    return (
      <SafeAreaView style={styles.centered}>
        {loadError ? (
          <EmptyState
            actionLabel="بازگشت"
            description="تغییرات شما به‌صورت خودکار ذخیره شده است."
            icon="alert-circle"
            onAction={() => router.back()}
            title={loadError}
          />
        ) : (
          <ActivityIndicator color={AppTheme.colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  const incidentType = incidentTypeOf(draft);
  if (incidentType === 'accident') {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          actionLabel="تکمیل در فرم تصادف"
          description="این واقعه از نوع تصادف است و با فرم هفت‌مرحله‌ای تصادف تکمیل می‌شود."
          icon="car"
          onAction={() =>
            router.replace({ pathname: '/incident/details', params: { uuid: draft.client_report_uuid } })
          }
          title="فرم تصادف لازم است"
        />
      </SafeAreaView>
    );
  }

  const evidenceError = errors['evidence'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.stepText}>ثبت {INCIDENT_TYPE_LABEL[incidentType]}</Text>
            {saveState === 'saved' ? (
              <StatusPill icon="checkmark-circle" label="ذخیره شد" tone="success" style={styles.savePill} />
            ) : saveState === 'saving' ? (
              <StatusPill dot label="در حال ذخیره…" tone="info" style={styles.savePill} />
            ) : null}
          </View>
          <Text style={styles.title}>{INCIDENT_TYPE_LABEL[incidentType]}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {refError ? (
            <Text style={styles.refWarning}>{refError}</Text>
          ) : null}

          <Card variant="default">
            <CardHeader
              action={
                <Button
                  icon={AppIcons.map.editLocation.name}
                  label="اصلاح موقعیت"
                  onPress={editLocation}
                  size="md"
                  variant="soft"
                />
              }
              icon={AppIcons.map.pinIncident.name}
              title="محل رخداد"
            />
            {draft.incident_coords ? (
              <Text style={styles.coordValue}>
                {formatCoordinate(draft.incident_coords.latitude)} ،{' '}
                {formatCoordinate(draft.incident_coords.longitude)}
              </Text>
            ) : null}
            {draft.road_snap ? (
              <Text style={styles.snapText}>
                {draft.road_snap.road_name ?? '—'}
                {draft.road_snap.direction ? ` · ${draft.road_snap.direction}` : ''}
              </Text>
            ) : null}
          </Card>

          <SectionHeader icon="clipboard-outline" title="شرح رخداد" />
          <Card variant="default">
            <FieldLabel text="شرح رخداد" />
            <FormInput
              hasError={Boolean(evidenceError)}
              multiline
              onChangeText={value => update({ description: value })}
              placeholder="شرح کوتاه وضعیت (ترک‌خوردگی، آبگرفتگی، نقص روشنایی و…)؛ در صورت نیاز می‌توانید خالی بگذارید."
              value={form.description}
            />
            {evidenceError ? <ErrorText text={evidenceError} /> : null}
            <HintRow text="برای ثبت، شرح یا دست‌کم یک «نقص راه» / «خسارت تجهیزات» لازم است." />
            <BoolChips label="خطر فوری برای تردد" onChange={value => update({ is_hazard: value })} value={form.is_hazard} />
            <BoolChips label="نیاز به تعمیر دارد" onChange={value => update({ needs_repair: value })} value={form.needs_repair} />
            <BoolChips label="نیاز به پیگیری بعدی دارد" onChange={value => update({ follow_up_required: value })} value={form.follow_up_required} />
            <FieldLabel text="اقدام موقت انجام‌شده" />
            <FormInput
              multiline
              onChangeText={value => update({ temporary_action: value })}
              placeholder="مثلاً بستن یک خط عبور، نصب علائم هشدار…"
              value={form.temporary_action}
            />
          </Card>

          <SectionHeader icon="tag-outline" title="شدت و علت" />
          <Card variant="default">
            <FieldLabel text="شدت رخداد" />
            {refs?.incident_severity ? (
              <IdChips
                options={refs.incident_severity}
                onChange={value => update({ incidentSeverityId: value })}
                value={form.incidentSeverityId}
              />
            ) : (
              <HintRow text="در حال بارگیری فهرست شدت…" />
            )}
          </Card>

          <SectionHeader icon={AppIcons.phases.environment.name} iconFamily={AppIcons.phases.environment.family} title="وضعیت راه" />
          <Card variant="default">
            <FieldLabel text="نقص راه (چند انتخابی)" />
            {refs?.road_defect ? (
              <MultiChips
                options={refs.road_defect}
                onChange={ids => update({ roadDefectIds: ids })}
                values={form.roadDefectIds}
              />
            ) : (
              <HintRow text="در حال بارگیری فهرست نواقص…" />
            )}
            <FieldLabel text="خسارت تجهیزات (چند انتخابی)" />
            {refs?.equipment_damage ? (
              <MultiChips
                options={refs.equipment_damage}
                onChange={ids => update({ equipmentDamageIds: ids })}
                values={form.equipmentDamageIds}
              />
            ) : (
              <HintRow text="در حال بارگیری فهرست تجهیزات…" />
            )}
            <FieldLabel text="موقعیت در راه / خط عبور" />
            {refs?.position ? (
              <IdChips
                options={refs.position}
                onChange={value => update({ positionId: value })}
                value={form.positionId}
              />
            ) : (
              <HintRow text="در حال بارگیری فهرست موقعیت…" />
            )}
          </Card>

          {evidenceError ? (
            <View style={styles.submitError}>
              <ErrorText text={evidenceError} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button label="بازگشت" onPress={goBack} variant="outline" style={styles.secondaryButton} />
          <Button icon="checkmark" label="ثبت و پایان" onPress={submit} style={styles.primaryButton} />
        </View>
      </KeyboardAvoidingView>

      <UploadModal
        onCancel={upload.cancel}
        // No «ادامه در پس‌زمینه» here: the officer pressed submit, so leaving a half-sent
        // report behind a dismissed dialog is exactly the confusion to avoid. The drafts
        // board is where a queue belongs.
        onClose={() => {
          upload.close();
          router.back();
        }}
        onRetry={upload.retry}
        onSkipFailed={upload.skipFailed}
        progress={upload.progress}
        visible={upload.visible}
      />
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
  content: { gap: 14, padding: 20, paddingBottom: 20 },
  coordValue: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.semiBold,
    fontSize: 14,
    textAlign: 'left',
  },
  snapText: {
    color: AppTheme.colors.textBody,
    fontFamily: Estedad.regular,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'right',
  },
  refWarning: {
    color: AppTheme.status.warning.deep,
    fontFamily: Estedad.regular,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'right',
  },
  submitError: {
    backgroundColor: AppTheme.status.danger.bg,
    borderRadius: Radius.md,
    padding: 12,
  },
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
