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
  FORM_PHASES,
  readFormState,
  validatePhase,
  typeOptionsCoverSeverity,
  type AccidentFormState,
  type FormPhaseId,
} from '@/domain/accident-form';
import { requeueDraft, saveFormState } from '@/domain/draft-actions';
import { incidentTypeOf } from '@/domain/incident-type';
import type { AccidentDraft } from '@/domain/types';
import { getDraft } from '@/storage/local-database';
import { formatCoordinate } from '@/domain/location-utils';
import {
  PhaseBasics,
  PhaseClassification,
  PhaseEnvironment,
  PhaseFacilities,
  PhasePeople,
  PhasePolice,
  PhaseVehicles,
} from '@/components/incident-phases';
import { Button } from '@/components/ui/button';
import { Banner } from '@/components/ui/banner';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { StatusPill } from '@/components/ui/status-pill';
import { StepperHeader, type StepperStep } from '@/components/ui/stepper-header';
import { AppIcons, type IconFamily, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad } from '@/constants/theme';
import { useRequiredSession } from '@/auth/use-required-session';

const AUTOSAVE_DEBOUNCE_MS = 500;

const NEEDED_REFERENCE_MODELS = [
  'type',
  'collision_type',
  'croquis_type',
  'vehicle_type',
  'vehicle_final_status',
  'driver_status',
  'injury_status',
  'person_role',
  'color',
  'system',
  'system_type',
  'plaque_type',
  'plaque_usage',
  'insurance_co',
  'body_insurance_co',
  'licence_type',
  'fault_status',
  'motion_direction',
  'human_reason',
  'max_damage_section',
  'area_usage',
  'light_status',
  'air_status',
  'road_situation',
  'road_surface_condition',
  'road_defect',
  'position',
  'police_station',
] as const;

const PHASE_ICONS: Record<FormPhaseId, { name: IconName; family?: IconFamily }> = {
  basics: AppIcons.phases.basicInfo,
  classification: AppIcons.phases.classification,
  police: AppIcons.phases.police,
  vehicles: AppIcons.phases.vehicles,
  people: AppIcons.phases.people,
  environment: AppIcons.phases.environment,
  facilities: AppIcons.phases.facilityDamage,
};

const STEPS: StepperStep[] = FORM_PHASES.map(phase => ({
  key: phase.id,
  label: phase.title,
  icon: PHASE_ICONS[phase.id].name,
  family: PHASE_ICONS[phase.id].family,
}));

export default function IncidentDetailsScreen() {
  const router = useRouter();
  const session = useRequiredSession();
  const params = useLocalSearchParams<{ uuid?: string }>();
  const uuid = typeof params.uuid === 'string' ? params.uuid : '';

  const [draft, setDraft] = useState<AccidentDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<AccidentFormState | null>(null);
  const [refs, setRefs] = useState<ReferenceSet | null>(null);
  const [refError, setRefError] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
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
            setLoadError('ابتدا محل حادثه را تأیید کنید.');
            return;
          }
          setDraft(existing);
          if (!loadedRef.current) {
            loadedRef.current = true;
            wasSyncedRef.current = existing.sync_status === 'synced';
            setForm(readFormState(existing));
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
      void saveFormState(uuid, form)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('idle'));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [form, uuid]);

  function update(patch: Partial<AccidentFormState>) {
    dirtyRef.current = true;
    setSaveState('idle');
    setForm(previous => (previous ? { ...previous, ...patch } : previous));
  }

  function flushSave(): Promise<void> {
    if (!form || !uuid || !dirtyRef.current) {
      return Promise.resolve();
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    return saveFormState(uuid, form)
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('idle'));
  }

  function finishEditing(): Promise<void> {
    return flushSave()
      .catch(() => undefined)
      .then(() => {
        dirtyRef.current = false;
        if (!wasSyncedRef.current) {
          return;
        }
        // The officer corrected an already-synced report: put it back into the
        // sync queue so the edits are submitted through accident.update.
        return requeueDraft(uuid).catch(() => undefined);
      });
  }

  function goNext() {
    if (!form) {
      return;
    }
    const phaseId = FORM_PHASES[phaseIndex].id;
    const phaseErrors = validatePhase(phaseId, form, {
      hasSeverityTypeRefs: typeOptionsCoverSeverity(refs?.type),
    });
    setErrors(phaseErrors);
    if (Object.keys(phaseErrors).length > 0) {
      return;
    }
    void flushSave().then(() => {
      if (phaseIndex < FORM_PHASES.length - 1) {
        setPhaseIndex(phaseIndex + 1);
      } else {
        void finishEditing().then(() => router.back());
      }
    });
  }

  function goBack() {
    void flushSave().then(() => {
      setErrors({});
      if (phaseIndex > 0) {
        setPhaseIndex(phaseIndex - 1);
      } else {
        void finishEditing().then(() => router.back());
      }
    });
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

  // The built-in seven-phase wizard is the accident fallback only. A non-accident
  // draft (backend v2) must complete through the lightweight per-type flow.
  if (incidentTypeOf(draft) !== 'accident') {
    return (
      <SafeAreaView style={styles.centered}>
        <EmptyState
          actionLabel="تکمیل در فرم مختصر"
          description="این واقعه از نوع تصادف نیست و با فرم مختصر مربوط به آن تکمیل می‌شود."
          icon="clipboard-outline"
          onAction={() =>
            router.replace({ pathname: '/incident/simple', params: { uuid: draft.client_report_uuid } })
          }
          title="فرم متفاوت لازم است"
        />
      </SafeAreaView>
    );
  }

  const phaseId = FORM_PHASES[phaseIndex].id;
  const isLastPhase = phaseIndex === FORM_PHASES.length - 1;
  const phasePropsBase = { form, errors, uuid };
  function setFormSafe(updater: (previous: AccidentFormState) => AccidentFormState) {
    setForm(previous => (previous ? updater(previous) : previous));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.stepText}>
              مرحله {(phaseIndex + 1).toLocaleString('fa-IR')} از {FORM_PHASES.length.toLocaleString('fa-IR')}
            </Text>
            {saveState === 'saved' ? (
              <StatusPill icon="checkmark-circle" label="ذخیره شد" tone="success" style={styles.savePill} />
            ) : saveState === 'saving' ? (
              <StatusPill dot label="در حال ذخیره…" tone="info" style={styles.savePill} />
            ) : null}
          </View>
          <StepperHeader currentIndex={phaseIndex} steps={STEPS} />
          <Text style={styles.title}>{FORM_PHASES[phaseIndex].title}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {refError ? (
            <Banner
              actionLabel="تلاش دوباره"
              message={refError}
              tone="warning"
              title="فهرست‌های سرور"
              onAction={loadRefs}
            />
          ) : null}

          {phaseId === 'basics' && (
            <>
              <Card variant="default">
                <CardHeader
                  action={
                    draft.incident_coords ? (
                      <Button
                        icon={AppIcons.map.editLocation.name}
                        label="اصلاح موقعیت"
                        onPress={editLocation}
                        size="md"
                        variant="soft"
                      />
                    ) : undefined
                  }
                  icon={AppIcons.phases.readOnly.name}
                  title="اطلاعات خودکار"
                />
                <View style={styles.metaBody}>
                  <MetaRow
                    icon={{ name: 'person', family: undefined }}
                    label="مأمور"
                    value={`${session.user.first_name} ${session.user.last_name}`}
                  />
                  <MetaRow
                    icon={AppIcons.map.pinIncident}
                    label="موقعیت واقعه"
                    value={
                      draft.incident_coords
                        ? `${formatCoordinate(draft.incident_coords.latitude)} ، ${formatCoordinate(draft.incident_coords.longitude)}`
                        : '—'
                    }
                  />
                  {draft.road_snap ? (
                    <MetaRow
                      icon={AppIcons.map.kilometer}
                      label="راه"
                      value={`${draft.road_snap.road_name ?? '—'}${draft.road_snap.direction ? ` · ${draft.road_snap.direction}` : ''}`}
                    />
                  ) : null}
                </View>
              </Card>
              <PhaseBasics {...phasePropsBase} update={update} />
            </>
          )}
          {phaseId === 'classification' && (
            <PhaseClassification {...phasePropsBase} refs={refs} update={update} />
          )}
          {phaseId === 'police' && <PhasePolice {...phasePropsBase} refs={refs} update={update} />}
          {phaseId === 'vehicles' && (
            <PhaseVehicles {...phasePropsBase} refs={refs} setForm={setFormSafe} />
          )}
          {phaseId === 'people' && <PhasePeople {...phasePropsBase} refs={refs} setForm={setFormSafe} />}
          {phaseId === 'environment' && (
            <PhaseEnvironment {...phasePropsBase} refs={refs} update={update} />
          )}
          {phaseId === 'facilities' && (
            <PhaseFacilities {...phasePropsBase} refs={refs} setForm={setFormSafe} />
          )}

          <View style={styles.spacer} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={phaseIndex > 0 ? 'مرحله قبل' : 'بازگشت'}
            onPress={() => void goBack()}
            variant="outline"
            style={styles.secondaryButton}
          />
          <Button
            icon={isLastPhase ? 'checkmark' : 'chevron-back'}
            label={isLastPhase ? 'ذخیره و بازگشت' : 'مرحله بعد'}
            onPress={() => void goNext()}
            style={styles.primaryButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MetaRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: { name: IconName; family?: IconFamily };
}) {
  return (
    <View style={styles.metaRow}>
      <Icon color={AppTheme.colors.textSecondary} family={icon.family} name={icon.name} size={15} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.metaValue}>
        {value}
      </Text>
    </View>
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
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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
  content: { gap: 14, padding: 20 },
  spacer: { height: 12 },
  metaBody: { gap: 9 },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    gap: 8,
  },
  metaLabel: {
    color: AppTheme.colors.textSecondary,
    fontFamily: Estedad.regular,
    fontSize: 13,
    lineHeight: 19,
    minWidth: 84,
    textAlign: 'right',
  },
  metaValue: {
    color: AppTheme.colors.textBody,
    flexShrink: 1,
    fontFamily: Estedad.semiBold,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
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
