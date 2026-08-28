import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { ReferenceSet } from '@/api/references';
import {
  SEVERITY_BY_TYPE_NAME,
  SEVERITY_OPTIONS,
  findTypeOptionForSeverity,
  typeOptionsCoverSeverity,
  type AccidentFormState,
  type FacilityCard,
  type PersonCard,
  type PhaseErrors,
  type Severity,
  type VehicleCard,
} from '@/domain/accident-form';
import { toInt } from '@/domain/number-utils';
import { MediaSection } from '@/components/media-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { AppIcons, type IconFamily, type IconName } from '@/constants/icon-map';
import { AppTheme, Estedad, Radius } from '@/constants/theme';
import {
  BoolChips,
  CardShell,
  ChipsRow,
  ErrorText,
  FieldLabel,
  FormInput,
  HintRow,
  IdChips,
  StructChips,
} from '@/components/form-fields';

type Base = {
  form: AccidentFormState;
  errors: PhaseErrors;
  uuid: string;
};

type WithUpdate = Base & {
  update: (patch: Partial<AccidentFormState>) => void;
};

type WithRefs = WithUpdate & {
  refs: ReferenceSet | null;
};

type WithCards = Base & {
  setForm: (updater: (previous: AccidentFormState) => AccidentFormState) => void;
  refs: ReferenceSet | null;
};

function listAt(errors: PhaseErrors, prefix: string): PhaseErrors {
  const result: PhaseErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    if (key.startsWith(`${prefix}.`)) {
      result[key.slice(prefix.length + 1)] = value;
    }
  }
  return result;
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button
      fullWidth
      icon="add"
      label={label}
      onPress={onPress}
      size="md"
      variant="outline"
      style={styles.addButton}
    />
  );
}

const SEVERITY_ICONS: Record<Severity, { name: IconName; family?: IconFamily }> = {
  damage: AppIcons.severity.propertyDamage,
  injury: AppIcons.severity.injury,
  fatal: AppIcons.severity.fatal,
};

function severityIconByName(name: string): { name: IconName; family?: IconFamily } | undefined {
  const severity = SEVERITY_BY_TYPE_NAME[name.trim()];
  return severity ? SEVERITY_ICONS[severity] : undefined;
}

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

export function PhaseBasics({ form, update, errors }: WithUpdate) {
  return (
    <>
      <FieldLabel text="تاریخ و ساعت دقیق وقوع تصادف" />
      <FormInput
        hasError={Boolean(errors['date_of_accident'])}
        onChangeText={value => update({ date_of_accident: value })}
        placeholder="2026-08-23T14:30"
        value={form.date_of_accident}
      />
      {errors['date_of_accident'] && <ErrorText text={errors['date_of_accident']} />}
      <HintRow text='پیش‌فرض زمان جاری است. قالب میلادی: YYYY-MM-DDTHH:mm' />

      <BoolChips
        label="آیا شاهدی وجود دارد؟"
        onChange={value => update({ has_witness: value })}
        value={form.has_witness}
      />

      <FieldLabel text="تعداد مجروح" />
      <FormInput
        keyboardType="number-pad"
        onChangeText={value => update({ injured_count: toInt(value) })}
        placeholder="—"
        value={form.injured_count?.toString() ?? ''}
      />
      {errors['injured_count'] && <ErrorText text={errors['injured_count']} />}

      <FieldLabel text="تعداد فوتی" />
      <FormInput
        keyboardType="number-pad"
        onChangeText={value => update({ dead_count: toInt(value) })}
        placeholder="—"
        value={form.dead_count?.toString() ?? ''}
      />
      {errors['dead_count'] && <ErrorText text={errors['dead_count']} />}

      <FieldLabel text="شماره خبر (اختیاری)" />
      <FormInput
        keyboardType="number-pad"
        onChangeText={value => update({ news_number: toInt(value) })}
        placeholder="—"
        value={form.news_number?.toString() ?? ''}
      />
      {errors['news_number'] && <ErrorText text={errors['news_number']} />}
    </>
  );
}

export function PhaseClassification({ form, update, errors, refs }: WithRefs) {
  const typeOptions = refs?.type;
  const severityCovered = typeOptionsCoverSeverity(typeOptions);
  const severityTypeOptions = severityCovered
    ? SEVERITY_OPTIONS.map(option => findTypeOptionForSeverity(option.value, typeOptions)).filter(
        (option): option is NonNullable<typeof option> => Boolean(option),
      )
    : [];

  // Restored drafts may carry a severity without the mapped typeId (for
  // example saved offline before references loaded) — fill it in once the
  // backend `type` list is available.
  useEffect(() => {
    if (!severityCovered || !form.severity || form.typeId) {
      return;
    }
    const option = findTypeOptionForSeverity(form.severity, typeOptions);
    if (option && option._id !== form.typeId) {
      update({ typeId: option._id });
    }
  }, [severityCovered, form.severity, form.typeId, typeOptions, update]);

  return (
    <>
      <FieldLabel text="شدت تصادف" />
      {severityCovered ? (
        <IdChips
          iconFor={option => severityIconByName(option.name)}
          onChange={id => {
            const selected = severityTypeOptions.find(option => option._id === id);
            update({
              typeId: id,
              severity: selected ? SEVERITY_BY_TYPE_NAME[selected.name.trim()] : undefined,
            });
          }}
          options={severityTypeOptions}
          value={form.typeId}
        />
      ) : (
        <IdChips
          iconFor={option => SEVERITY_ICONS[option._id as Severity]}
          onChange={id =>
            update({ severity: id as Severity, typeId: undefined })
          }
          options={SEVERITY_OPTIONS.map(option => ({ _id: option.value, name: option.label }))}
          value={form.severity}
        />
      )}
      {errors['severity'] && <ErrorText text={errors['severity']} />}
      {!severityCovered && (
        <HintRow text="فهرست شدت‌ها از سرور بارگیری نشده است؛ انتخاب شما پس از اتصال با سامانه همگام می‌شود." />
      )}
      {errors['typeId'] && <ErrorText text={errors['typeId']} />}
      <HintRow text="با انتخاب جرحی یا فوتی، تکمیل بخش افراد الزامی می‌شود." />

      <FieldLabel text="نوع برخورد" />
      {!refs?.collision_type ? (
        <HintRow text="در حال بارگیری فهرست…" />
      ) : (
        <IdChips
          onChange={id => update({ collisionTypeId: id })}
          options={refs.collision_type}
          value={form.collisionTypeId}
        />
      )}
      {errors['collisionTypeId'] && <ErrorText text={errors['collisionTypeId']} />}
    </>
  );
}

function PoliceStationPicker({
  form,
  refs,
  update,
}: {
  form: AccidentFormState;
  refs: ReferenceSet | null;
  update: (patch: Partial<AccidentFormState>) => void;
}) {
  const stations = refs?.police_station;
  if (!stations || stations.length === 0) {
    return (
      <>
        <FormInput
          onChangeText={value => update({ police_station_name: value })}
          placeholder="نام واحد یا پاسگاه"
          value={form.police_station_name ?? ''}
        />
        <HintRow text="فهرست پاسگاه‌ها در دسترس نیست؛ نام را دستی وارد کنید." />
      </>
    );
  }
  const selectedId = form.policeStationId;
  return (
    <Card style={styles.stationCard} variant="outlined">
      {stations.map((station, index) => {
        const selected = station._id === selectedId;
        return (
          <ListRow
            icon={AppIcons.police.station.name}
            iconFamily={AppIcons.police.station.family}
            iconTone={selected ? 'primary' : 'neutral'}
            key={station._id}
            onPress={() =>
              update(
                selected
                  ? { policeStationId: undefined, police_station_name: undefined }
                  : { policeStationId: station._id, police_station_name: station.name },
              )
            }
            style={index < stations.length - 1 ? styles.stationRowDivider : undefined}
            title={station.name}
            trailing={
              selected ? <Icon color={AppTheme.colors.primaryStrong} name="checkmark" size={18} /> : undefined
            }
          />
        );
      })}
    </Card>
  );
}

export function PhasePolice({ form, update, errors, refs, uuid }: WithRefs) {
  return (
    <>
      <BoolChips
        label="آیا پلیس در محل حضور یافته است؟"
        onChange={value => update({ police_present: value })}
        value={form.police_present}
      />

      {form.police_present && (
        <>
          <FieldLabel text="واحد یا پاسگاه پلیس" />
          <PoliceStationPicker form={form} refs={refs} update={update} />

          <FieldLabel text="نام کارشناس پلیس" />
          <FormInput
            hasError={Boolean(errors['police_expert_name'])}
            onChangeText={value => update({ police_expert_name: value })}
            placeholder="نام و نام خانوادگی"
            value={form.police_expert_name ?? ''}
          />
          {errors['police_expert_name'] && <ErrorText text={errors['police_expert_name']} />}

          <FieldLabel text="زمان حضور پلیس" />
          <FormInput
            hasError={Boolean(errors['police_arrival_time'])}
            onChangeText={value => update({ police_arrival_time: value })}
            placeholder="2026-08-23T15:10"
            value={form.police_arrival_time ?? ''}
          />
          {errors['police_arrival_time'] && <ErrorText text={errors['police_arrival_time']} />}

          <FieldLabel text="نوع کروکی" />
          {!refs?.croquis_type ? (
            <HintRow text="در حال بارگیری فهرست…" />
          ) : (
            <IdChips
              onChange={id => update({ croquisTypeId: id })}
              options={refs.croquis_type}
              value={form.croquisTypeId}
            />
          )}
          {errors['croquisTypeId'] && <ErrorText text={errors['croquisTypeId']} />}

          <FieldLabel text="توضیحات توصیفی مأمور درباره علت تصادف" />
          <FormInput
            multiline
            onChangeText={value => update({ officer_cause_description: value })}
            placeholder="شرح دلایل وقوع تصادف از نظر مأمور"
            value={form.officer_cause_description ?? ''}
          />

          <MediaSection
            category="croquis"
            clientReportUuid={uuid}
            owner="croquis"
            title="تصویر کروکی"
          />
        </>
      )}
    </>
  );
}

function DriverFields({
  driver,
  errors,
  refs,
  onChange,
}: {
  driver: NonNullable<VehicleCard['driver']>;
  errors: PhaseErrors;
  refs: ReferenceSet;
  onChange: (patch: Partial<NonNullable<VehicleCard['driver']>>) => void;
}) {
  return (
    <View style={styles.subCard}>
      <Text style={styles.sectionTitle}>راننده</Text>
      <FieldLabel text="نام" />
      <FormInput
        hasError={Boolean(errors['first_name'])}
        onChangeText={value => onChange({ first_name: value })}
        value={driver.first_name ?? ''}
      />
      {errors['first_name'] && <ErrorText text={errors['first_name']} />}
      <FieldLabel text="نام خانوادگی" />
      <FormInput
        hasError={Boolean(errors['last_name'])}
        onChangeText={value => onChange({ last_name: value })}
        value={driver.last_name ?? ''}
      />
      {errors['last_name'] && <ErrorText text={errors['last_name']} />}
      <FieldLabel text="کد ملی" />
      <FormInput
        hasError={Boolean(errors['national_code'])}
        keyboardType="number-pad"
        onChangeText={value => onChange({ national_code: value })}
        value={driver.national_code ?? ''}
      />
      {errors['national_code'] && <ErrorText text={errors['national_code']} />}
      <FieldLabel text="تلفن همراه" />
      <FormInput
        keyboardType="number-pad"
        onChangeText={value => onChange({ phone: value })}
        value={driver.phone ?? ''}
      />
      <BoolChips
        label="جنسیت"
        onChange={value => onChange({ sex: value ? 'Male' : 'Female' })}
        value={driver.sex === 'Male' ? true : driver.sex === 'Female' ? false : undefined}
      />
      <FieldLabel text="وضعیت راننده" />
      <StructChips
        onChange={value => onChange({ driver_status: value })}
        options={refs.driver_status ?? []}
        value={driver.driver_status}
      />
      <FieldLabel text="نوع صدمه" />
      <StructChips
        onChange={value => onChange({ injury_type: value })}
        options={refs.injury_status ?? []}
        value={driver.injury_type}
      />
      <FieldLabel text="علل کلی" />
      <StructChips
        onChange={value => onChange({ total_reason: value })}
        options={refs.human_reason ?? []}
        value={driver.total_reason}
      />
      <FieldLabel text="نوع گواهینامه" />
      <StructChips
        onChange={value => onChange({ licence_type: value })}
        options={refs.licence_type ?? []}
        value={driver.licence_type}
      />
      <FieldLabel text="شماره گواهینامه" />
      <FormInput onChangeText={value => onChange({ licence_number: value })} value={driver.licence_number ?? ''} />
    </View>
  );
}

function VehicleCardEditor({
  card,
  cardErrors,
  index,
  refs,
  uuid,
  onChange,
  onRemove,
}: {
  card: VehicleCard;
  cardErrors: PhaseErrors;
  index: number;
  refs: ReferenceSet;
  uuid: string;
  onChange: (patch: Partial<VehicleCard>) => void;
  onRemove: () => void;
}) {
  return (
    <CardShell index={index} onRemove={onRemove} title="وسیله نقلیه">
      <FieldLabel text="نوع وسیله" />
      <StructChips
        onChange={value => onChange({ vehicle_type: value })}
        options={refs.vehicle_type ?? []}
        value={card.vehicle_type}
      />
      {cardErrors['vehicle_type'] && <ErrorText text={cardErrors['vehicle_type']} />}

      <FieldLabel text="برند (سیستم)" />
      <StructChips onChange={value => onChange({ system: value })} options={refs.system ?? []} value={card.system} />

      <FieldLabel text="تیپ سیستم" />
      <StructChips
        onChange={value => onChange({ system_type: value })}
        options={refs.system_type ?? []}
        value={card.system_type}
      />

      <FieldLabel text="رنگ" />
      <StructChips onChange={value => onChange({ color: value })} options={refs.color ?? []} value={card.color} />

      <FieldLabel text="سال ساخت" />
      <FormInput
        keyboardType="number-pad"
        onChangeText={value => onChange({ year: toInt(value) })}
        placeholder="—"
        value={card.year?.toString() ?? ''}
      />

      <FieldLabel text="وضعیت نهایی وسیله" />
      <StructChips
        onChange={value => onChange({ final_status: value })}
        options={refs.vehicle_final_status ?? []}
        value={card.final_status}
      />
      {cardErrors['final_status'] && <ErrorText text={cardErrors['final_status']} />}

      <FieldLabel text="نوع پلاک" />
      <StructChips
        onChange={value => onChange({ plaque_type: value })}
        options={refs.plaque_type ?? []}
        value={card.plaque_type}
      />

      <FieldLabel text="پلاک (سه بخش)" />
      <View style={styles.plaqueRow}>
        {[0, 1, 2].map(part => (
          <FormInput
            key={part}
            onChangeText={value => {
              const current: [string, string, string] = [...(card.plaque_no ?? ['', '', ''])];
              current[part] = value;
              onChange({ plaque_no: current });
            }}
            style={styles.plaquePart}
            value={card.plaque_no?.[part] ?? ''}
          />
        ))}
      </View>
      {cardErrors['plaque_no'] && <ErrorText text={cardErrors['plaque_no']} />}

      <FieldLabel text="نوع کاربری پلاک" />
      <StructChips
        onChange={value => onChange({ plaque_usage: value })}
        options={refs.plaque_usage ?? []}
        value={card.plaque_usage}
      />

      <FieldLabel text="وضعیت تقصیر" />
      <StructChips
        onChange={value => onChange({ fault_status: value })}
        options={refs.fault_status ?? []}
        value={card.fault_status}
      />

      <FieldLabel text="جهت حرکت" />
      <StructChips
        onChange={value => onChange({ motion_direction: value })}
        options={refs.motion_direction ?? []}
        value={card.motion_direction}
      />

      <FieldLabel text="بیمه‌گر شخص ثالث" />
      <StructChips
        onChange={value => onChange({ insurance_co: value })}
        options={refs.insurance_co ?? []}
        value={card.insurance_co}
      />

      <FieldLabel text="شماره بیمه‌نامه شخص ثالث" />
      <FormInput onChangeText={value => onChange({ insurance_no: value })} value={card.insurance_no ?? ''} />

      <FieldLabel text="بیمه‌گر بدنه" />
      <StructChips
        onChange={value => onChange({ body_insurance_co: value })}
        options={refs.body_insurance_co ?? []}
        value={card.body_insurance_co}
      />

      <FieldLabel text="شماره بیمه‌نامه بدنه" />
      <FormInput onChangeText={value => onChange({ body_insurance_no: value })} value={card.body_insurance_no ?? ''} />

      <MediaSection
        category="plate"
        clientReportUuid={uuid}
        owner={`vehicle:${index}`}
        title="تصویر پلاک"
      />
      <MediaSection
        category="insurance"
        clientReportUuid={uuid}
        owner={`vehicle:${index}`}
        title="تصاویر بیمه‌نامه"
      />

      <DriverFields
        driver={card.driver ?? {}}
        errors={cardErrors}
        onChange={patch => onChange({ driver: { ...(card.driver ?? {}), ...patch } })}
        refs={refs}
      />
    </CardShell>
  );
}

export function PhaseVehicles({ form, setForm, errors, refs, uuid }: WithCards) {
  const safeRefs: ReferenceSet = refs ?? {};

  function updateCard(index: number, patch: Partial<VehicleCard>) {
    setForm(previous => ({
      ...previous,
      vehicles: previous.vehicles.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    }));
  }

  return (
    <>
      {form.vehicles.map((card, index) => (
        <VehicleCardEditor
          card={card}
          cardErrors={listAt(errors, `vehicles.${index}`)}
          index={index}
          key={index}
          onChange={patch => updateCard(index, patch)}
          onRemove={() =>
            setForm(previous => ({
              ...previous,
              vehicles: previous.vehicles.filter((_, i) => i !== index),
            }))
          }
          refs={safeRefs}
          uuid={uuid}
        />
      ))}
      <AddButton
        label="افزودن وسیله نقلیه"
        onPress={() => setForm(previous => ({ ...previous, vehicles: [...previous.vehicles, {}] }))}
      />
    </>
  );
}

function PersonList({
  cards,
  title,
  showRole,
  showPhone,
  refs,
  errors,
  onAdd,
  onChange,
  onRemove,
}: {
  cards: PersonCard[];
  title: string;
  showRole?: boolean;
  showPhone?: boolean;
  refs: ReferenceSet;
  errors: PhaseErrors;
  onAdd: () => void;
  onChange: (index: number, patch: Partial<PersonCard>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <>
      <Text style={styles.listTitle}>{title}</Text>
      {cards.map((card, index) => {
        const cardErrors = listAt(errors, `${index}`);
        return (
          <CardShell index={index} key={index} onRemove={() => onRemove(index)} title={title}>
            <FieldLabel text="نام" />
            <FormInput onChangeText={value => onChange(index, { first_name: value })} value={card.first_name ?? ''} />
            <FieldLabel text="نام خانوادگی" />
            <FormInput onChangeText={value => onChange(index, { last_name: value })} value={card.last_name ?? ''} />
            <FieldLabel text="کد ملی" />
            <FormInput
              keyboardType="number-pad"
              onChangeText={value => onChange(index, { national_code: value })}
              value={card.national_code ?? ''}
            />
            {showPhone && (
              <>
                <FieldLabel text="تلفن همراه" />
                <FormInput
                  keyboardType="number-pad"
                  onChangeText={value => onChange(index, { phone: value })}
                  value={card.phone ?? ''}
                />
              </>
            )}
            <BoolChips
              label="جنسیت"
              onChange={value => onChange(index, { sex: value ? 'Male' : 'Female' })}
              value={card.sex === 'Male' ? true : card.sex === 'Female' ? false : undefined}
            />
            {showRole ? (
              <>
                <FieldLabel text="نقش فرد" />
                <StructChips
                  onChange={value => onChange(index, { role: value })}
                  options={refs.person_role ?? []}
                  value={card.role}
                />
                <FieldLabel text="سن" />
                <FormInput
                  keyboardType="number-pad"
                  onChangeText={value => onChange(index, { age: toInt(value) })}
                  value={card.age?.toString() ?? ''}
                />
                <FieldLabel text="وضعیت مصدومیت" />
                <StructChips
                  onChange={value => onChange(index, { injury_status: value })}
                  options={refs.injury_status ?? []}
                  value={card.injury_status}
                />
              </>
            ) : (
              <>
                <FieldLabel text="وضعیت صدمه" />
                <StructChips
                  onChange={value => onChange(index, { injury_type: value })}
                  options={refs.injury_status ?? []}
                  value={card.injury_type}
                />
              </>
            )}
            <FieldLabel text="وضعیت تقصیر" />
            <StructChips
              onChange={value => onChange(index, { fault_status: value })}
              options={refs.fault_status ?? []}
              value={card.fault_status}
            />
            <FieldLabel text="علل کلی" />
            <StructChips
              onChange={value => onChange(index, { total_reason: value })}
              options={refs.human_reason ?? []}
              value={card.total_reason}
            />
            {Object.keys(cardErrors).length > 0 && (
              <ErrorText text={Object.values(cardErrors)[0]} />
            )}
          </CardShell>
        );
      })}
      <AddButton label={`افزودن ${title}`} onPress={onAdd} />
    </>
  );
}

export function PhasePeople({ form, setForm, errors, refs }: WithCards) {
  const safeRefs: ReferenceSet = refs ?? {};

  function sectionProps(title: string, key: 'passengers' | 'pedestrians' | 'people') {
    return {
      cards: form[key],
      errors: listAt(errors, key),
      onAdd: () => setForm(previous => ({ ...previous, [key]: [...previous[key], {}] })),
      onChange: (index: number, patch: Partial<PersonCard>) =>
        setForm(previous => ({
          ...previous,
          [key]: previous[key].map((card, i) => (i === index ? { ...card, ...patch } : card)),
        })),
      onRemove: (index: number) =>
        setForm(previous => ({
          ...previous,
          [key]: previous[key].filter((_, i) => i !== index),
        })),
    };
  }

  return (
    <>
      <PersonList {...sectionProps('سرنشینان', 'passengers')} refs={safeRefs} title="سرنشینان" />
      <PersonList
        {...sectionProps('عابران پیاده', 'pedestrians')}
        refs={safeRefs}
        title="عابران پیاده"
      />
      <PersonList
        {...sectionProps('سایر افراد', 'people')}
        refs={safeRefs}
        showPhone
        showRole
        title="سایر افراد"
      />
      {errors['people_required'] && <ErrorText text={errors['people_required']} />}
    </>
  );
}

export function PhaseEnvironment({ form, update, errors, refs }: WithRefs) {
  const safeRefs: ReferenceSet = refs ?? {};
  return (
    <>
      <FieldLabel text="وضعیت هوا" />
      <MultiChips
        onChange={ids => update({ airStatusIds: ids })}
        options={safeRefs.air_status ?? []}
        values={form.airStatusIds}
      />

      <FieldLabel text="روشنایی محیط" />
      {!safeRefs.light_status ? (
        <HintRow text="در حال بارگیری فهرست…" />
      ) : (
        <IdChips
          onChange={id => update({ lightStatusId: id })}
          options={safeRefs.light_status}
          value={form.lightStatusId}
        />
      )}
      {errors['lightStatusId'] && <ErrorText text={errors['lightStatusId']} />}

      <FieldLabel text="وضعیت راه (هندسه)" />
      {!safeRefs.road_situation ? (
        <HintRow text="در حال بارگیری فهرست…" />
      ) : (
        <IdChips
          onChange={id => update({ roadSituationId: id })}
          options={safeRefs.road_situation}
          value={form.roadSituationId}
        />
      )}
      {errors['roadSituationId'] && <ErrorText text={errors['roadSituationId']} />}

      <FieldLabel text="وضعیت سطح راه" />
      <MultiChips
        onChange={ids => update({ roadSurfaceConditionIds: ids })}
        options={safeRefs.road_surface_condition ?? []}
        values={form.roadSurfaceConditionIds}
      />

      <FieldLabel text="عیوب راه" />
      <MultiChips
        onChange={ids => update({ roadDefectIds: ids })}
        options={safeRefs.road_defect ?? []
        }
        values={form.roadDefectIds}
      />
    </>
  );
}

export function PhaseFacilities({ form, setForm, errors, refs, uuid }: WithCards) {
  const safeRefs: ReferenceSet = refs ?? {};

  function updateCard(index: number, patch: Partial<FacilityCard>) {
    setForm(previous => ({
      ...previous,
      facilities: previous.facilities.map((card, i) => (i === index ? { ...card, ...patch } : card)),
    }));
  }

  return (
    <>
      <HintRow text="تصاویر تأسیسات در مرحله رسانه‌ها اضافه می‌شود." />
      {form.facilities.map((card, index) => {
        const cardErrors = listAt(errors, `facilities.${index}`);
        return (
          <CardShell
            index={index}
            key={index}
            onRemove={() =>
              setForm(previous => ({
                ...previous,
                facilities: previous.facilities.filter((_, i) => i !== index),
              }))
            }
            title="خسارت تأسیسات"
          >
            <FieldLabel text="گروه تأسیسات" />
            <StructChips
              onChange={value => updateCard(index, { asset_group: value })}
              options={safeRefs.area_usage ?? []}
              value={card.asset_group}
            />
            {cardErrors['asset_group'] && <ErrorText text={cardErrors['asset_group']} />}

            <FieldLabel text="کد دارایی" />
            <FormInput onChangeText={value => updateCard(index, { asset_code: value })} value={card.asset_code ?? ''} />

            <FieldLabel text="نوع خسارت" />
            <FormInput onChangeText={value => updateCard(index, { damage_type: value })} value={card.damage_type ?? ''} />

            <FieldLabel text="شدت خسارت" />
            <StructChips
              onChange={value => updateCard(index, { damage_severity: value })}
              options={safeRefs.damage_severity ?? []}
              value={card.damage_severity}
            />
            {cardErrors['damage_severity'] && <ErrorText text={cardErrors['damage_severity']} />}

            <FieldLabel text="مقدار" />
            <FormInput
              keyboardType="number-pad"
              onChangeText={value => updateCard(index, { quantity: toInt(value) })}
              value={card.quantity?.toString() ?? ''}
            />
            {cardErrors['quantity'] && <ErrorText text={cardErrors['quantity']} />}

            <FieldLabel text="واحد" />
            <FormInput onChangeText={value => updateCard(index, { unit: value })} value={card.unit ?? ''} />

            <BoolChips
              label="ایجاد خطر می‌کند؟"
              onChange={value => updateCard(index, { creates_hazard: value })}
              value={card.creates_hazard}
            />
            <BoolChips
              label="نیاز به تعمیر دارد؟"
              onChange={value => updateCard(index, { needs_repair: value })}
              value={card.needs_repair}
            />

            <FieldLabel text="اقدام موقت" />
            <FormInput
              onChangeText={value => updateCard(index, { temporary_action: value })}
              value={card.temporary_action ?? ''}
            />

            <MediaSection
              category="damage"
              clientReportUuid={uuid}
              owner={`facility:${index}`}
              title="تصاویر خسارت"
            />
          </CardShell>
        );
      })}
      <AddButton
        label="افزودن خسارت تأسیسات"
        onPress={() => setForm(previous => ({ ...previous, facilities: [...previous.facilities, {}] }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  subCard: {
    backgroundColor: AppTheme.colors.surfaceMuted,
    borderRadius: Radius.md,
    gap: 8,
    padding: 12,
  },
  sectionTitle: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'right',
  },
  plaqueRow: { flexDirection: 'row-reverse', gap: 8 },
  plaquePart: { flex: 1, minHeight: 46, textAlign: 'center' },
  listTitle: {
    color: AppTheme.colors.textStrong,
    fontFamily: Estedad.bold,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 10,
    textAlign: 'right',
  },
  stationCard: { paddingHorizontal: 14, paddingVertical: 4 },
  stationRowDivider: {
    borderBottomColor: AppTheme.colors.hairline,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addButton: { marginTop: 4 },
});
