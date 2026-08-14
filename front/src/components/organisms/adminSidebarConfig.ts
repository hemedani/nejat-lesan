import {
  AmbulanceIcon,
  BrainCircuitIcon,
  BuildingIcon,
  CalendarIcon,
  CarIcon,
  CloudIcon,
  CogIcon,
  DocumentTextIcon,
  FactoryIcon,
  HomeIcon,
  IdCardIcon,
  LocationMarkerIcon,
  MapIcon,
  MapPinIcon,
  RoadIcon,
  ShieldIcon,
  SunIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/atoms/Icons";
import { ComponentType } from "react";

export type IconName =
  | "ambulance"
  | "brainCircuit"
  | "building"
  | "calendar"
  | "car"
  | "cloud"
  | "cog"
  | "document"
  | "factory"
  | "home"
  | "idCard"
  | "locationMarker"
  | "map"
  | "mapPin"
  | "road"
  | "shield"
  | "sun"
  | "tag"
  | "truck"
  | "users";

export type AdminNavItem = {
  key: string;
  label: string;
  href: string;
  icon: IconName;
};

export type AdminNavGroup = {
  id: string;
  title: string;
  icon: IconName;
  items: AdminNavItem[];
};

export const iconRegistry: Record<IconName, ComponentType<{ className?: string }>> = {
  ambulance: AmbulanceIcon,
  brainCircuit: BrainCircuitIcon,
  building: BuildingIcon,
  calendar: CalendarIcon,
  car: CarIcon,
  cloud: CloudIcon,
  cog: CogIcon,
  document: DocumentTextIcon,
  factory: FactoryIcon,
  home: HomeIcon,
  idCard: IdCardIcon,
  locationMarker: LocationMarkerIcon,
  map: MapIcon,
  mapPin: MapPinIcon,
  road: RoadIcon,
  shield: ShieldIcon,
  sun: SunIcon,
  tag: TagIcon,
  truck: TruckIcon,
  users: UsersIcon,
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "main",
    title: "اصلی",
    icon: "home",
    items: [
      { key: "dashboard", label: "داشبورد", href: "/admin", icon: "home" },
      { key: "users", label: "کاربران", href: "/admin/users", icon: "users" },
    ],
  },
  {
    id: "accidents-events",
    title: "تصادفات و رویدادها",
    icon: "ambulance",
    items: [
      { key: "accident", label: "تصادف", href: "/admin/accident", icon: "ambulance" },
      { key: "event", label: "رویداد", href: "/admin/event", icon: "calendar" },
    ],
  },
  {
    id: "geography",
    title: "جغرافیا",
    icon: "map",
    items: [
      { key: "province", label: "استان", href: "/admin/province", icon: "locationMarker" },
      { key: "township", label: "شهرستان", href: "/admin/township", icon: "mapPin" },
      { key: "city", label: "شهر", href: "/admin/city", icon: "building" },
      { key: "road", label: "جاده", href: "/admin/road", icon: "road" },
      { key: "city_zone", label: "منطقه شهری", href: "/admin/city-zone", icon: "map" },
      { key: "traffic_zone", label: "منطقه ترافیکی", href: "/admin/traffic-zone", icon: "road" },
      { key: "air_pollution_zone", label: "منطقه آلودگی هوا", href: "/admin/air-pollution-zone", icon: "factory" },
      { key: "position", label: "موقعیت", href: "/admin/position", icon: "mapPin" },
    ],
  },
  {
    id: "accident-conditions",
    title: "شرایط تصادف",
    icon: "shield",
    items: [
      { key: "type", label: "نوع تصادف", href: "/admin/type", icon: "tag" },
      { key: "collision_type", label: "نوع برخورد", href: "/admin/collision-type", icon: "cog" },
      { key: "light_status", label: "وضعیت نور", href: "/admin/light-status", icon: "sun" },
      { key: "air_status", label: "وضعیت هوا", href: "/admin/air-status", icon: "cloud" },
      { key: "road_situation", label: "وضعیت جاده", href: "/admin/road-situation", icon: "road" },
      { key: "road_surface_condition", label: "شرایط سطح جاده", href: "/admin/road-surface-condition", icon: "road" },
      { key: "shoulder_status", label: "وضعیت شانه جاده", href: "/admin/shoulder-status", icon: "road" },
      { key: "road_repair_type", label: "نوع تعمیر جاده", href: "/admin/road-repair-type", icon: "cog" },
      { key: "road_defect", label: "عیب جاده", href: "/admin/road-defect", icon: "cog" },
      { key: "ruling_type", label: "نوع حکم", href: "/admin/ruling-type", icon: "document" },
      { key: "area_usage", label: "نوع کاربری منطقه", href: "/admin/area-usage", icon: "map" },
    ],
  },
  {
    id: "vehicles",
    title: "وسایل نقلیه",
    icon: "car",
    items: [
      { key: "system", label: "سیستم", href: "/admin/system", icon: "cog" },
      { key: "system_type", label: "نوع سیستم", href: "/admin/system-type", icon: "cog" },
      { key: "color", label: "رنگ", href: "/admin/color", icon: "tag" },
      { key: "plaque_type", label: "نوع پلاک", href: "/admin/plaque-type", icon: "idCard" },
      { key: "plaque_usage", label: "نوع کاربری پلاک", href: "/admin/plaque-usage", icon: "idCard" },
      { key: "motion_direction", label: "جهت حرکت", href: "/admin/motion-direction", icon: "truck" },
      { key: "max_damage_section", label: "بیشترین خسارت در بخش", href: "/admin/max-damage-section", icon: "cog" },
      { key: "fault_status", label: "وضعیت مقصر", href: "/admin/fault-status", icon: "shield" },
      { key: "equipment_damage", label: "خسارت تجهیزات", href: "/admin/equipment-damage", icon: "cog" },
    ],
  },
  {
    id: "insurance",
    title: "بیمه",
    icon: "shield",
    items: [
      { key: "insurance_co", label: "شرکت بیمه", href: "/admin/insurance-co", icon: "shield" },
      { key: "body_insurance_co", label: "شرکت بیمه بدنه", href: "/admin/body-insurance-co", icon: "shield" },
    ],
  },
  {
    id: "drivers",
    title: "رانندگان",
    icon: "idCard",
    items: [
      { key: "licence_type", label: "نوع گواهینامه", href: "/admin/licence-type", icon: "idCard" },
    ],
  },
  {
    id: "accident-causes",
    title: "علل تصادف",
    icon: "brainCircuit",
    items: [
      { key: "human_reason", label: "علت انسانی", href: "/admin/human-reason", icon: "brainCircuit" },
      { key: "vehicle_reason", label: "علت مربوط به خودرو", href: "/admin/vehicle-reason", icon: "car" },
    ],
  },
];
