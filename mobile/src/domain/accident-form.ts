import type { ReferenceOption } from '@/api/references';
import type { AccidentDraft } from './types';

export type RefStruct = { _id: string; name: string };

export const FORM_PHASES = [
  { id: 'basics', title: 'اطلاعات پایه' },
  { id: 'classification', title: 'طبقه‌بندی تصادف' },
  { id: 'police', title: 'پلیس و کروکی' },
  { id: 'vehicles', title: 'وسایل نقلیه' },
  { id: 'people', title: 'افراد' },
  { id: 'environment', title: 'محیط و راه' },
  { id: 'facilities', title: 'خسارت تأسیسات' },
] as const;

export type FormPhaseId = (typeof FORM_PHASES)[number]['id'];

export type Severity = 'damage' | 'injury' | 'fatal';

export const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: 'damage', label: 'خسارتی' },
  { value: 'injury', label: 'جرحی' },
  { value: 'fatal', label: 'فوتی' },
];

export type DriverInfo = {
  sex?: string;
  first_name?: string;
  last_name?: string;
  national_code?: string;
  phone?: string;
  licence_number?: string;
  licence_type?: RefStruct;
  injury_type?: RefStruct;
  driver_status?: RefStruct;
  total_reason?: RefStruct;
};

export type VehicleCard = {
  vehicle_type?: RefStruct;
  system?: RefStruct;
  system_type?: RefStruct;
  color?: RefStruct;
  year?: number;
  final_status?: RefStruct;
  plaque_type?: RefStruct;
  plaque_no?: [string, string, string];
  plaque_serial?: string[];
  plaque_usage?: RefStruct;
  print_number?: string;
  fault_status?: RefStruct;
  motion_direction?: RefStruct;
  insurance_co?: RefStruct;
  insurance_no?: string;
  insurance_date?: string;
  body_insurance_co?: RefStruct;
  body_insurance_no?: string;
  body_insurance_date?: string;
  insurance_warranty_limit?: number;
  max_damage_sections?: RefStruct[];
  damage_section_other?: string;
  driver?: DriverInfo;
};

export type PersonCard = {
  sex?: string;
  first_name?: string;
  last_name?: string;
  national_code?: string;
  phone?: string;
  injury_type?: RefStruct;
  injury_status?: RefStruct;
  fault_status?: RefStruct;
  total_reason?: RefStruct;
  role?: RefStruct;
  age?: number;
};

export type FacilityCard = {
  asset_group?: RefStruct;
  asset_code?: string;
  damage_type?: string;
  damage_severity?: RefStruct;
  quantity?: number;
  unit?: string;
  creates_hazard?: boolean;
  needs_repair?: boolean;
  temporary_action?: string;
};

const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function isValidDatetime(value: string | undefined): boolean {
  return typeof value === 'string' && DATETIME_PATTERN.test(value);
}

function normalizeDatetime(value: unknown): string {
  if (typeof value === 'string' && DATETIME_PATTERN.test(value)) {
    return value.slice(0, 16);
  }
  try {
    return new Date().toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

function asStruct(value: unknown): RefStruct | undefined {
  if (
    value &&
    typeof value === 'object' &&
    typeof (value as RefStruct)._id === 'string' &&
    typeof (value as RefStruct).name === 'string'
  ) {
    return value as RefStruct;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asBool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function asStructArray(value: unknown): RefStruct[] {
  return Array.isArray(value) ? value.map(asStruct).filter((v): v is RefStruct => Boolean(v)) : [];
}

export type AccidentFormState = {
  date_of_accident: string;
  severity?: Severity;
  typeId?: string;
  collisionTypeId?: string;
  injured_count?: number;
  dead_count?: number;
  news_number?: number;
  has_witness?: boolean;
  police_present: boolean;
  police_station_name?: string;
  policeStationId?: string;
  police_expert_name?: string;
  police_arrival_time?: string;
  croquisTypeId?: string;
  officer_cause_description?: string;
  vehicles: VehicleCard[];
  passengers: PersonCard[];
  pedestrians: PersonCard[];
  people: PersonCard[];
  lightStatusId?: string;
  roadSituationId?: string;
  positionId?: string;
  airStatusIds: string[];
  roadSurfaceConditionIds: string[];
  roadDefectIds: string[];
  facilities: FacilityCard[];
};

function readDriver(raw: unknown): DriverInfo | undefined {
  if (!raw || typeof raw !== 'object') {
    return undefined;
  }
  const d = raw as Record<string, unknown>;
  const driver: DriverInfo = {
    sex: asString(d['sex']),
    first_name: asString(d['first_name']),
    last_name: asString(d['last_name']),
    national_code: asString(d['national_code']),
    phone: asString(d['phone']),
    licence_number: asString(d['licence_number']),
    licence_type: asStruct(d['licence_type']),
    injury_type: asStruct(d['injury_type']),
    driver_status: asStruct(d['driver_status']),
    total_reason: asStruct(d['total_reason']),
  };
  return driver;
}

function readVehicle(raw: unknown): VehicleCard {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const plaqueNoRaw = Array.isArray(v['plaque_no']) ? v['plaque_no'] : [];
  const plaqueSerial = Array.isArray(v['plaque_serial'])
    ? v['plaque_serial'].filter(s => typeof s === 'string')
    : [];
  const driver = readDriver(v['driver']);
  return {
    vehicle_type: asStruct(v['vehicle_type']),
    system: asStruct(v['system']),
    system_type: asStruct(v['system_type']),
    color: asStruct(v['color']),
    year: asNumber(v['year']),
    final_status: asStruct(v['final_status']),
    plaque_type: asStruct(v['plaque_type']),
    plaque_no:
      plaqueNoRaw.length === 3
        ? [String(plaqueNoRaw[0]), String(plaqueNoRaw[1]), String(plaqueNoRaw[2])]
        : undefined,
    plaque_serial: plaqueSerial.length > 0 ? plaqueSerial : undefined,
    plaque_usage: asStruct(v['plaque_usage']),
    print_number: asString(v['print_number']),
    fault_status: asStruct(v['fault_status']),
    motion_direction: asStruct(v['motion_direction']),
    insurance_co: asStruct(v['insurance_co']),
    insurance_no: asString(v['insurance_no']),
    insurance_date: normalizeDatetime(v['insurance_date']),
    body_insurance_co: asStruct(v['body_insurance_co']),
    body_insurance_no: asString(v['body_insurance_no']),
    body_insurance_date: normalizeDatetime(v['body_insurance_date']),
    insurance_warranty_limit: asNumber(v['insurance_warranty_limit']),
    max_damage_sections: asStructArray(v['max_damage_sections']),
    damage_section_other: asString(v['damage_section_other']),
    driver,
  };
}

function readPerson(raw: unknown): PersonCard {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    sex: asString(p['sex']),
    first_name: asString(p['first_name']),
    last_name: asString(p['last_name']),
    national_code: asString(p['national_code']),
    phone: asString(p['phone']),
    injury_type: asStruct(p['injury_type']),
    injury_status: asStruct(p['injury_status']),
    fault_status: asStruct(p['fault_status']),
    total_reason: asStruct(p['total_reason']),
    role: asStruct(p['role']),
    age: asNumber(p['age']),
  };
}

function readFacility(raw: unknown): FacilityCard {
  const f = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    asset_group: asStruct(f['asset_group']),
    asset_code: asString(f['asset_code']),
    damage_type: asString(f['damage_type']),
    damage_severity: asStruct(f['damage_severity']),
    quantity: asNumber(f['quantity']),
    unit: asString(f['unit']),
    creates_hazard: asBool(f['creates_hazard']),
    needs_repair: asBool(f['needs_repair']),
    temporary_action: asString(f['temporary_action']),
  };
}

function readIdList(source: Record<string, unknown>, key: string): string[] {
  const raw = source[key];
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

export function readFormState(draft: AccidentDraft): AccidentFormState {
  const data = draft.data ?? {};
  const vehiclesRaw = Array.isArray(data['vehicle_dtos']) ? data['vehicle_dtos'] : [];
  return {
    date_of_accident: normalizeDatetime(data['date_of_accident']),
    severity: data['severity'] as Severity | undefined,
    typeId: asString(data['typeId']),
    collisionTypeId: asString(data['collisionTypeId']),
    injured_count: asNumber(data['injured_count']),
    dead_count: asNumber(data['dead_count']),
    news_number: asNumber(data['news_number']),
    has_witness: asBool(data['has_witness']),
    police_present: data['police_present'] === true,
    police_station_name: asString(data['police_station_name']),
    policeStationId: asString(data['policeStationId']),
    police_expert_name: asString(data['police_expert_name']),
    police_arrival_time:
      typeof data['police_arrival_time'] === 'string'
        ? normalizeDatetime(data['police_arrival_time'])
        : undefined,
    croquisTypeId: asString(data['croquisTypeId']),
    officer_cause_description: asString(data['officer_cause_description']),
    vehicles: vehiclesRaw.map(readVehicle),
    passengers: (Array.isArray(data['passenger_dtos']) ? data['passenger_dtos'] : []).map(readPerson),
    pedestrians: (Array.isArray(data['pedestrian_dtos']) ? data['pedestrian_dtos'] : []).map(readPerson),
    people: (Array.isArray(data['people_dtos']) ? data['people_dtos'] : []).map(readPerson),
    lightStatusId: asString(data['lightStatusId']),
    roadSituationId: asString(data['roadSituationId']),
    positionId: asString(data['positionId']),
    airStatusIds: readIdList(data, 'airStatusesIds'),
    roadSurfaceConditionIds: readIdList(data, 'roadSurfaceConditionsIds'),
    roadDefectIds: readIdList(data, 'roadDefectIds'),
    facilities: (Array.isArray(data['facility_damage_dtos']) ? data['facility_damage_dtos'] : []).map(
      readFacility,
    ),
  };
}

function driverToDto(driver: DriverInfo | undefined): Record<string, unknown> | undefined {
  if (!driver) {
    return undefined;
  }
  return { ...driver };
}

function vehicleToDto(card: VehicleCard): Record<string, unknown> {
  const dto: Record<string, unknown> = { ...card };
  const driverDto = driverToDto(card.driver);
  if (driverDto) {
    dto['driver'] = driverDto;
  }
  return dto;
}

function personToDto(card: PersonCard): Record<string, unknown> {
  return { ...card };
}

function facilityToDto(card: FacilityCard): Record<string, unknown> {
  return { ...card };
}

export function formToData(state: AccidentFormState): Record<string, unknown> {
  return {
    date_of_accident: state.date_of_accident,
    severity: state.severity,
    typeId: state.typeId,
    collisionTypeId: state.collisionTypeId,
    injured_count: state.injured_count,
    dead_count: state.dead_count,
    news_number: state.news_number,
    has_witness: state.has_witness,
    police_present: state.police_present,
    police_station_name: state.police_station_name,
    policeStationId: state.policeStationId,
    police_expert_name: state.police_expert_name,
    police_arrival_time: state.police_arrival_time,
    croquisTypeId: state.croquisTypeId,
    officer_cause_description: state.officer_cause_description,
    vehicle_dtos: state.vehicles.map(vehicleToDto),
    passenger_dtos: state.passengers.map(personToDto),
    pedestrian_dtos: state.pedestrians.map(personToDto),
    people_dtos: state.people.map(personToDto),
    lightStatusId: state.lightStatusId,
    roadSituationId: state.roadSituationId,
    positionId: state.positionId,
    airStatusesIds: state.airStatusIds,
    roadSurfaceConditionsIds: state.roadSurfaceConditionIds,
    roadDefectIds: state.roadDefectIds,
    facility_damage_dtos: state.facilities.map(facilityToDto),
  };
}

export type PhaseErrors = Record<string, string>;

export type ValidationContext = {
  /** True when the backend `type` reference list is loaded (severity → typeId mapping available). */
  hasSeverityTypeRefs?: boolean;
};

export function validatePhase(
  phase: FormPhaseId,
  state: AccidentFormState,
  context: ValidationContext = {},
): PhaseErrors {
  const errors: PhaseErrors = {};

  if (phase === 'basics') {
    if (!isValidDatetime(state.date_of_accident)) {
      errors['date_of_accident'] = 'تاریخ را در قالب مشخص وارد کنید.';
    }
    for (const key of ['news_number', 'injured_count', 'dead_count'] as const) {
      const value = state[key];
      if (value != null && value < 0) {
        errors[key] = 'این مقدار نمی‌تواند منفی باشد.';
      }
    }
  }

  if (phase === 'classification') {
    if (!state.severity) {
      errors['severity'] = 'شدت تصادف را انتخاب کنید.';
    }
    // The severity picker drives the backend `type` relation; the id can only
    // be resolved once the reference list is loaded. Offline drafts stay valid
    // locally and gain typeId as soon as references arrive.
    if (!state.typeId && context.hasSeverityTypeRefs) {
      errors['typeId'] = 'نوع واقعه را انتخاب کنید.';
    }
    if (!state.collisionTypeId) {
      errors['collisionTypeId'] = 'نوع برخورد را انتخاب کنید.';
    }
  }

  if (phase === 'police' && state.police_present) {
    if (!state.police_expert_name || state.police_expert_name.trim().length < 2) {
      errors['police_expert_name'] = 'نام کارشناس پلیس را وارد کنید.';
    }
    if (!isValidDatetime(state.police_arrival_time)) {
      errors['police_arrival_time'] = 'زمان حضور پلیس را وارد کنید.';
    }
    if (!state.croquisTypeId) {
      errors['croquisTypeId'] = 'نوع کروکی را انتخاب کنید.';
    }
  }

  if (phase === 'vehicles') {
    state.vehicles.forEach((card, index) => {
      const prefix = `vehicles.${index}`;
      if (!card.vehicle_type) {
        errors[`${prefix}.vehicle_type`] = 'نوع وسیله را انتخاب کنید.';
      }
      if (!card.final_status) {
        errors[`${prefix}.final_status`] = 'وضعیت نهایی را انتخاب کنید.';
      }
      if (!card.plaque_no || card.plaque_no.some(part => part.trim().length === 0)) {
        errors[`${prefix}.plaque_no`] = 'هر سه بخش پلاک را وارد کنید.';
      }
      if (
        !card.driver ||
        !card.driver.first_name?.trim() ||
        !card.driver.last_name?.trim() ||
        !card.driver.national_code?.trim()
      ) {
        errors[`${prefix}.driver`] = 'نام، نام خانوادگی و کد ملی راننده الزامی است.';
      }
    });
  }

  if (phase === 'people') {
    if (state.severity === 'injury' || state.severity === 'fatal') {
      const totalPeople =
        state.passengers.length + state.pedestrians.length + state.people.length;
      const countsIndicate =
        (state.injured_count ?? 0) > 0 || (state.dead_count ?? 0) > 0;
      if (totalPeople === 0 && !countsIndicate) {
        errors['people_required'] =
          'برای حادثه جرحی یا فوتی، حداقل یک کارت فرد یا شمارش مصدوم/فوتی لازم است.';
      }
    }
  }

  if (phase === 'environment') {
    if (!state.lightStatusId) {
      errors['lightStatusId'] = 'روشنایی محیط را انتخاب کنید.';
    }
    if (!state.roadSituationId) {
      errors['roadSituationId'] = 'وضعیت راه را انتخاب کنید.';
    }
  }

  if (phase === 'facilities') {
    state.facilities.forEach((card, index) => {
      const prefix = `facilities.${index}`;
      if (!card.asset_group) {
        errors[`${prefix}.asset_group`] = 'گروه تأسیسات را انتخاب کنید.';
      }
      if (!card.damage_severity) {
        errors[`${prefix}.damage_severity`] = 'شدت خسارت را انتخاب کنید.';
      }
      if (card.quantity == null || card.quantity < 0) {
        errors[`${prefix}.quantity`] = 'مقدار معتبر وارد کنید.';
      }
    });
  }

  return errors;
}

export function hasIncompleteRequiredVehicleCards(state: AccidentFormState): boolean {
  if (state.vehicles.length === 0) {
    return false;
  }
  return Object.keys(validatePhase('vehicles', state)).length > 0;
}

export function optionName(options: ReferenceOption[] | undefined, id: string | undefined): string | undefined {
  if (!id || !options) {
    return undefined;
  }
  return options.find(option => option._id === id)?.name;
}

/**
 * The backend has no `severity` field — the `type` model carries
 * خسارتی/جرحی/فوتی and `accident.add` accepts it as `typeId`.
 */
export const SEVERITY_TYPE_NAMES: Record<Severity, string> = {
  damage: 'خسارتی',
  injury: 'جرحی',
  fatal: 'فوتی',
};

export const SEVERITY_BY_TYPE_NAME: Record<string, Severity> = Object.fromEntries(
  SEVERITY_OPTIONS.map(option => [SEVERITY_TYPE_NAMES[option.value], option.value]),
) as Record<string, Severity>;

export function findTypeOptionForSeverity(
  severity: Severity | undefined,
  options: ReferenceOption[] | undefined,
): ReferenceOption | undefined {
  if (!severity || !options || options.length === 0) {
    return undefined;
  }
  const name = SEVERITY_TYPE_NAMES[severity];
  return options.find(option => option.name.trim() === name);
}

/** True when the loaded `type` list contains all three severity documents. */
export function typeOptionsCoverSeverity(options: ReferenceOption[] | undefined): boolean {
  if (!options || options.length === 0) {
    return false;
  }
  return SEVERITY_OPTIONS.every(option =>
    Boolean(findTypeOptionForSeverity(option.value, options)),
  );
}
