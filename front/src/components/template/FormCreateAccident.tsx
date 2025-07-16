"use client";

import "leaflet/dist/leaflet.css";
import React from "react";
import type { Marker as LeafletMarker } from "leaflet";
import {
  useForm,
  SubmitHandler,
  useFieldArray,
  Resolver,
} from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { LatLngExpression } from "leaflet";
import { ToastNotify } from "@/utils/helper";
import type { CSSObjectWithLabel } from "react-select";
import MyInput from "../atoms/MyInput";
import MyDateInput from "../atoms/MyDateInput";
import MyAsyncMultiSelect from "../atoms/MyAsyncMultiSelect";
import MySelectWithName from "../atoms/MySelectWithName";
import { add } from "@/app/actions/accident/add";
import { gets as getProvinces } from "@/app/actions/province/gets";
import { gets as getCities } from "@/app/actions/city/gets";
import { gets as getCityZones } from "@/app/actions/city_zone/gets";
import { gets as getTrafficZones } from "@/app/actions/traffic_zone/gets";
import { gets as getRoads } from "@/app/actions/road/gets";
import { gets as getRoadDefects } from "@/app/actions/road_defect/gets";
import { gets as getRoadRepairTypes } from "@/app/actions/road_repair_type/gets";
import { gets as getRoadSituations } from "@/app/actions/road_situation/gets";
import { gets as getRoadSurfaceConditions } from "@/app/actions/road_surface_condition/gets";
import { gets as getPositions } from "@/app/actions/position/gets";
import { gets as getTypes } from "@/app/actions/type/gets";
import { gets as getAirStatuses } from "@/app/actions/air_status/gets";
import { gets as getLightStatuses } from "@/app/actions/light_status/gets";
import { gets as getShoulderStatuses } from "@/app/actions/shoulder_status/gets";
import { gets as getAreaUsages } from "@/app/actions/area_usage/gets";
import { gets as getCollisionTypes } from "@/app/actions/collision_type/gets";
import { gets as getEquipmentDamages } from "@/app/actions/equipment_damage/gets";
import { gets as getRulingTypes } from "@/app/actions/ruling_type/gets";
import { gets as getHumanReasons } from "@/app/actions/human_reason/gets";
import { gets as getVehicleReasons } from "@/app/actions/vehicle_reason/gets";
import { gets as getColors } from "@/app/actions/color/gets";
import { gets as getPlaqueTypes } from "@/app/actions/plaque_type/gets";
import { gets as getPlaqueUsages } from "@/app/actions/plaque_usage/gets";
import { gets as getLicenceTypes } from "@/app/actions/licence_type/gets";
import { gets as getInsuranceCos } from "@/app/actions/insurance_co/gets";
import { gets as getBodyInsuranceCos } from "@/app/actions/body_insurance_co/gets";
import { gets as getFaultStatuses } from "@/app/actions/fault_status/gets";
import { gets as getMotionDirections } from "@/app/actions/motion_direction/gets";
import { gets as getSystems } from "@/app/actions/system/gets";
import { gets as getSystemTypes } from "@/app/actions/system_type/gets";

// Dynamic imports for map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);

// Draggable marker component
const DraggableMarker = dynamic(
  () =>
    import("react-leaflet").then((mod) => {
      const { Marker } = mod;
      return function DraggableMarkerComponent({
        position,
        onMove,
      }: {
        position: [number, number];
        onMove: (lat: number, lng: number) => void;
      }) {
        const markerRef = React.useRef<LeafletMarker>(null);

        const eventHandlers = React.useMemo(
          () => ({
            dragend() {
              const marker = markerRef.current;
              if (marker != null) {
                const { lat, lng } = marker.getLatLng();
                onMove(lat, lng);
              }
            },
          }),
          [onMove],
        );

        return (
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
          />
        );
      };
    }),
  { ssr: false },
);

// Single select component for location fields
const MySingleSelect = dynamic(
  () =>
    import("react-select/async").then((mod) => {
      const AsyncSelect = mod.default;
      return function MySingleSelectComponent({
        name,
        label,
        loadOptions,
        setValue,
        defaultOptions = true,
        errMsg,
        placeholder,
      }: {
        name: string;
        label: string;
        loadOptions: (
          inputValue: string,
        ) => Promise<{ value: string; label: string }[]>;
        setValue: (name: string, value: string) => void;
        defaultOptions?: boolean;
        errMsg?: string;
        placeholder?: string;
      }) {
        return (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 text-right">
              {label}
            </label>
            <AsyncSelect
              cacheOptions
              defaultOptions={defaultOptions}
              loadOptions={loadOptions}
              onChange={(newVal: { value: string; label: string } | null) =>
                setValue(name, newVal?.value || "")
              }
              placeholder={placeholder || `${label} را انتخاب کنید`}
              noOptionsMessage={() => "گزینه‌ای یافت نشد"}
              loadingMessage={() => "در حال بارگذاری..."}
              isClearable
              isRtl
              styles={{
                control: (provided: CSSObjectWithLabel) => ({
                  ...provided,
                  minHeight: "48px",
                  borderRadius: "12px",
                  borderColor: errMsg ? "#ef4444" : "#cbd5e1",
                  direction: "rtl",
                }),
                option: (provided: CSSObjectWithLabel) => ({
                  ...provided,
                  direction: "rtl",
                  textAlign: "right",
                }),
                singleValue: (provided: CSSObjectWithLabel) => ({
                  ...provided,
                  direction: "rtl",
                }),
              }}
            />
            {errMsg && (
              <span className="text-red-500 text-xs font-medium text-right mt-1">
                {errMsg}
              </span>
            )}
          </div>
        );
      };
    }),
  { ssr: false },
);

// Validation schema
const AccidentCreateSchema = z.object({
  seri: z.coerce.number().min(1, "شماره سری الزامی است"),
  serial: z.coerce.number().min(1, "شماره سریال الزامی است"),
  date_of_accident: z.string().min(1, "تاریخ حادثه الزامی است"),
  completion_date: z.string().min(1, "تاریخ تکمیل الزامی است"),
  dead_count: z.coerce.number().min(0, "تعداد کشته نمی‌تواند منفی باشد"),
  injured_count: z.coerce.number().min(0, "تعداد مجروح نمی‌تواند منفی باشد"),
  news_number: z.coerce.number().min(1, "شماره خبر الزامی است"),
  officer: z.string().min(1, "نام افسر الزامی است"),
  has_witness: z.boolean(),
  latitude: z
    .union([z.coerce.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const persianNumbers = [
          "۰",
          "۱",
          "۲",
          "۳",
          "۴",
          "۵",
          "۶",
          "۷",
          "۸",
          "۹",
        ];
        const englishNumbers = [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ];
        let converted = val;
        for (let i = 0; i < persianNumbers.length; i++) {
          converted = converted.replace(
            new RegExp(persianNumbers[i], "g"),
            englishNumbers[i],
          );
        }
        converted = converted.replace(/٫/g, ".");
        return parseFloat(converted);
      }
      return val;
    })
    .refine(
      (val) => val >= -90 && val <= 90,
      "عرض جغرافیایی باید بین -90 تا 90 باشد",
    ),
  longitude: z
    .union([z.coerce.number(), z.string()])
    .transform((val) => {
      if (typeof val === "string") {
        const persianNumbers = [
          "۰",
          "۱",
          "۲",
          "۳",
          "۴",
          "۵",
          "۶",
          "۷",
          "۸",
          "۹",
        ];
        const englishNumbers = [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
        ];
        let converted = val;
        for (let i = 0; i < persianNumbers.length; i++) {
          converted = converted.replace(
            new RegExp(persianNumbers[i], "g"),
            englishNumbers[i],
          );
        }
        converted = converted.replace(/٫/g, ".");
        return parseFloat(converted);
      }
      return val;
    })
    .refine(
      (val) => val >= -180 && val <= 180,
      "طول جغرافیایی باید بین -180 تا 180 باشد",
    ),
  province: z.string().optional(),
  city: z.string().optional(),
  road: z.string().optional(),
  traffic_zone: z.string().optional(),
  city_zone: z.string().optional(),
  type: z.string().optional(),
  area_usages: z.array(z.string()).optional(),
  position: z.string().optional(),
  ruling_type: z.string().optional(),
  air_statuses: z.array(z.string()).optional(),
  light_status: z.string().optional(),
  road_defects: z.array(z.string()).optional(),
  human_reasons: z.array(z.string()).optional(),
  collision_type: z.string().optional(),
  road_situation: z.string().optional(),
  road_repair_type: z.string().optional(),
  shoulder_status: z.string().optional(),
  vehicle_reasons: z.array(z.string()).optional(),
  equipment_damages: z.array(z.string()).optional(),
  road_surface_conditions: z.array(z.string()).optional(),
  vehicle_dtos: z
    .array(
      z.object({
        color: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        system: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        plaque_type: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        plaque_usage: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        system_type: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        fault_status: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        insurance_co: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        insurance_no: z.string().optional(),
        insurance_date: z.string().optional(),
        body_insurance_co: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        body_insurance_no: z.string().optional(),
        body_insurance_date: z.string().optional(),
        motion_direction: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        print_number: z.string().optional(),
        insurance_warranty_limit: z.coerce.number().optional(),
        damage_section_other: z.string().optional(),
        plaque_no: z.array(z.string()).optional(),
        plaque_serial: z.array(z.string()).optional(),
        max_damage_sections: z.array(z.string()).optional(),
        driver: z.object({
          first_name: z.string().min(1, "نام راننده الزامی است"),
          last_name: z.string().min(1, "نام خانوادگی راننده الزامی است"),
          national_code: z.string().min(1, "کد ملی راننده الزامی است"),
          sex: z.enum(["Male", "Female", "Other"]),
          licence_type: z
            .object({
              _id: z.string(),
              name: z.string(),
            })
            .optional(),
          licence_number: z.string().optional(),
          injury_type: z
            .object({
              _id: z.string(),
              name: z.string(),
            })
            .optional(),
          total_reason: z
            .object({
              _id: z.string(),
              name: z.string(),
            })
            .optional(),
        }),
        passenger_dtos: z
          .array(
            z.object({
              first_name: z.string().min(1, "نام مسافر الزامی است"),
              last_name: z.string().min(1, "نام خانوادگی مسافر الزامی است"),
              national_code: z.string().min(1, "کد ملی مسافر الزامی است"),
              sex: z.enum(["Male", "Female", "Other"]),
              injury_type: z
                .object({
                  _id: z.string(),
                  name: z.string(),
                })
                .optional(),
              fault_status: z
                .object({
                  _id: z.string(),
                  name: z.string(),
                })
                .optional(),
              total_reason: z
                .object({
                  _id: z.string(),
                  name: z.string(),
                })
                .optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
  pedestrian_dtos: z
    .array(
      z.object({
        first_name: z.string().min(1, "نام عابر پیاده الزامی است"),
        last_name: z.string().min(1, "نام خانوادگی عابر پیاده الزامی است"),
        national_code: z.string().min(1, "کد ملی عابر پیاده الزامی است"),
        sex: z.enum(["Male", "Female", "Other"]),
        injury_type: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        fault_status: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
        total_reason: z
          .object({
            _id: z.string(),
            name: z.string(),
          })
          .optional(),
      }),
    )
    .optional(),
});

type AccidentFormCreateSchemaType = Omit<
  z.infer<typeof AccidentCreateSchema>,
  "latitude" | "longitude"
> & {
  latitude: number;
  longitude: number;
};

const FormCreateAccident = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AccidentFormCreateSchemaType>({
    resolver: zodResolver(
      AccidentCreateSchema,
    ) as Resolver<AccidentFormCreateSchemaType>,
    defaultValues: {
      dead_count: 0,
      injured_count: 0,
      has_witness: false,
      latitude: 31.304661792933331,
      longitude: 48.649177551269495,
      vehicle_dtos: [],
      pedestrian_dtos: [],
    },
  });

  const {
    fields: vehicleFields,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({
    control,
    name: "vehicle_dtos",
  });

  const {
    fields: pedestrianFields,
    append: appendPedestrian,
    remove: removePedestrian,
  } = useFieldArray({
    control,
    name: "pedestrian_dtos",
  });

  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");

  const handleMarkerMove = (lat: number, lng: number) => {
    setValue("latitude", lat);
    setValue("longitude", lng);
  };

  // Convert Persian numerals to English numerals
  const convertPersianToEnglish = (str: string): string => {
    const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

    let result = str.toString();

    // Convert Persian numerals to English
    for (let i = 0; i < persianNumbers.length; i++) {
      result = result.replace(
        new RegExp(persianNumbers[i], "g"),
        englishNumbers[i],
      );
    }

    // Convert Persian decimal separator to English
    result = result.replace(/٫/g, ".");

    return result;
  };

  // Load options functions for single selects
  const loadProvinces = async (inputValue: string) => {
    try {
      const response = await getProvinces({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadCities = async (inputValue: string) => {
    try {
      const response = await getCities({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadCityZones = async (inputValue: string) => {
    try {
      const response = await getCityZones({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadTrafficZones = async (inputValue: string) => {
    try {
      const response = await getTrafficZones({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadRoads = async (inputValue: string) => {
    try {
      const response = await getRoads({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadTypes = async (inputValue: string) => {
    try {
      const response = await getTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadPositions = async (inputValue: string) => {
    try {
      const response = await getPositions({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadRulingTypes = async (inputValue: string) => {
    try {
      const response = await getRulingTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadLightStatuses = async (inputValue: string) => {
    try {
      const response = await getLightStatuses({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadShoulderStatuses = async (inputValue: string) => {
    try {
      const response = await getShoulderStatuses({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadCollisionTypes = async (inputValue: string) => {
    try {
      const response = await getCollisionTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadRoadSituations = async (inputValue: string) => {
    try {
      const response = await getRoadSituations({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadRoadRepairTypes = async (inputValue: string) => {
    try {
      const response = await getRoadRepairTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  // Load functions for multi-selects (arrays)
  const loadRoadDefects = async (inputValue: string) => {
    try {
      const response = await getRoadDefects({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadRoadSurfaceConditions = async (inputValue: string) => {
    try {
      const response = await getRoadSurfaceConditions({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadAirStatuses = async (inputValue: string) => {
    try {
      const response = await getAirStatuses({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadHumanReasons = async (inputValue: string) => {
    try {
      const response = await getHumanReasons({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadVehicleReasons = async (inputValue: string) => {
    try {
      const response = await getVehicleReasons({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadEquipmentDamages = async (inputValue: string) => {
    try {
      const response = await getEquipmentDamages({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadAreaUsages = async (inputValue: string) => {
    try {
      const response = await getAreaUsages({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  // Load functions for vehicle/pedestrian fields
  const loadColors = async (inputValue: string) => {
    try {
      const response = await getColors({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadSystems = async (inputValue: string) => {
    try {
      const response = await getSystems({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadPlaqueTypes = async (inputValue: string) => {
    try {
      const response = await getPlaqueTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadPlaqueUsages = async (inputValue: string) => {
    try {
      const response = await getPlaqueUsages({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadSystemTypes = async (inputValue: string) => {
    try {
      const response = await getSystemTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadFaultStatuses = async (inputValue: string) => {
    try {
      const response = await getFaultStatuses({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadInsuranceCos = async (inputValue: string) => {
    try {
      const response = await getInsuranceCos({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadBodyInsuranceCos = async (inputValue: string) => {
    try {
      const response = await getBodyInsuranceCos({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadMotionDirections = async (inputValue: string) => {
    try {
      const response = await getMotionDirections({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  const loadLicenceTypes = async (inputValue: string) => {
    try {
      const response = await getLicenceTypes({
        set: { name: inputValue, page: 1, limit: 50 },
        get: { _id: 1, name: 1 },
      });
      return response.success
        ? response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }))
        : [];
    } catch {
      return [];
    }
  };

  // Helper function to handle setValue with proper typing for vehicle/pedestrian fields
  const handleSetValue = (
    name: string,
    value: { _id: string; name: string } | null,
  ) => {
    setValue(
      name as keyof AccidentFormCreateSchemaType,
      value as unknown as AccidentFormCreateSchemaType[keyof AccidentFormCreateSchemaType],
    );
  };

  // Wrapper function to match MySingleSelect signature
  const setValueWrapper = (name: string, value: string) => {
    setValue(
      name as keyof AccidentFormCreateSchemaType,
      value as AccidentFormCreateSchemaType[keyof AccidentFormCreateSchemaType],
    );
  };

  const onSubmit: SubmitHandler<AccidentFormCreateSchemaType> = async (
    data,
  ) => {
    setIsSubmitting(true);
    try {
      const { latitude, longitude, ...restData } = data;

      // Convert Persian numerals to English and parse as float
      const latStr = convertPersianToEnglish(latitude.toString());
      const lngStr = convertPersianToEnglish(longitude.toString());

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      // Convert date strings to Date objects and transform data structure
      const accidentData = {
        ...restData,
        date_of_accident: restData.date_of_accident
          ? new Date(restData.date_of_accident)
          : undefined,
        completion_date: restData.completion_date
          ? new Date(restData.completion_date)
          : undefined,
        location: {
          type: "Point" as const,
          coordinates: [lng, lat] as [number, number],
        },
        // Use correct API field names with Id suffix
        provinceId: restData.province,
        cityId: restData.city,
        roadId: restData.road,
        trafficZoneId: restData.traffic_zone,
        cityZoneId: restData.city_zone,
        typeId: restData.type,
        positionId: restData.position,
        rulingTypeId: restData.ruling_type,
        lightStatusId: restData.light_status,
        collisionTypeId: restData.collision_type,
        roadSituationId: restData.road_situation,
        roadRepairTypeId: restData.road_repair_type,
        shoulderStatusId: restData.shoulder_status,
        areaUsagesIds: restData.area_usages,
        airStatusesIds: restData.air_statuses,
        roadDefectsIds: restData.road_defects,
        humanReasonsIds: restData.human_reasons,
        vehicleReasonsIds: restData.vehicle_reasons,
        equipmentDamagesIds: restData.equipment_damages,
        roadSurfaceConditionsIds: restData.road_surface_conditions,
        // Transform vehicle data to match API structure
        vehicle_dtos: restData.vehicle_dtos?.map((vehicle) => ({
          ...vehicle,
          insurance_date: vehicle.insurance_date
            ? new Date(vehicle.insurance_date)
            : undefined,
          body_insurance_date: vehicle.body_insurance_date
            ? new Date(vehicle.body_insurance_date)
            : undefined,
          max_damage_sections: vehicle.max_damage_sections?.map(
            (id: string) => ({ _id: id }),
          ),
          passenger_dtos: vehicle.passenger_dtos?.map(
            (passenger: Record<string, unknown>) => ({
              ...passenger,
            }),
          ),
        })),
        // Transform pedestrian data to match API structure
        pedestrian_dtos: restData.pedestrian_dtos?.map((pedestrian) => ({
          ...pedestrian,
        })),
      };

      // Remove the original form fields that are now mapped to Id fields
      const processedData = accidentData as Record<string, unknown>;
      delete processedData.province;
      delete processedData.city;
      delete processedData.road;
      delete processedData.traffic_zone;
      delete processedData.city_zone;
      delete processedData.type;
      delete processedData.position;
      delete processedData.ruling_type;
      delete processedData.light_status;
      delete processedData.collision_type;
      delete processedData.road_situation;
      delete processedData.road_repair_type;
      delete processedData.shoulder_status;
      delete processedData.area_usages;
      delete processedData.air_statuses;
      delete processedData.road_defects;
      delete processedData.human_reasons;
      delete processedData.vehicle_reasons;
      delete processedData.equipment_damages;
      delete processedData.road_surface_conditions;

      const result = await add(processedData as Parameters<typeof add>[0]);

      if (result.success) {
        ToastNotify("success", "حادثه با موفقیت اضافه شد");
        router.push("/admin/accident");
      } else {
        ToastNotify("error", result.message || "خطا در افزودن حادثه");
      }
    } catch {
      ToastNotify("error", "خطا در ارسال اطلاعات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addVehicle = () => {
    appendVehicle({
      color: undefined,
      system: undefined,
      plaque_type: undefined,
      plaque_usage: undefined,
      system_type: undefined,
      fault_status: undefined,
      insurance_co: undefined,
      insurance_no: "",
      insurance_date: "",
      body_insurance_co: undefined,
      body_insurance_no: "",
      body_insurance_date: "",
      motion_direction: undefined,
      print_number: "",
      insurance_warranty_limit: 0,
      damage_section_other: "",
      plaque_no: [],
      plaque_serial: [],
      max_damage_sections: [],
      driver: {
        first_name: "",
        last_name: "",
        national_code: "",
        sex: "Male" as const,
        licence_type: undefined,
        licence_number: "",
        injury_type: undefined,
        total_reason: undefined,
      },
      passenger_dtos: [],
    });
  };

  const addPedestrian = () => {
    appendPedestrian({
      first_name: "",
      last_name: "",
      national_code: "",
      sex: "Male" as const,
      injury_type: undefined,
      fault_status: undefined,
      total_reason: undefined,
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          افزودن حادثه جدید
        </h1>
        <p className="text-gray-600">اطلاعات کامل حادثه را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            اطلاعات پایه
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MyInput
              name="seri"
              label="شماره سری"
              type="number"
              register={register}
              errMsg={errors.seri?.message}
            />
            <MyInput
              name="serial"
              label="شماره سریال"
              type="number"
              register={register}
              errMsg={errors.serial?.message}
            />
            <MyInput
              name="news_number"
              label="شماره خبر"
              type="number"
              register={register}
              errMsg={errors.news_number?.message}
            />
            <MyInput
              name="officer"
              label="نام افسر"
              register={register}
              errMsg={errors.officer?.message}
            />
            <MyInput
              name="dead_count"
              label="تعداد کشته"
              type="number"
              register={register}
              errMsg={errors.dead_count?.message}
            />
            <MyInput
              name="injured_count"
              label="تعداد مجروح"
              type="number"
              register={register}
              errMsg={errors.injured_count?.message}
            />
          </div>
        </div>

        {/* Date Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            اطلاعات تاریخ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MyDateInput
              name="date_of_accident"
              label="تاریخ حادثه"
              control={control}
              errMsg={errors.date_of_accident?.message}
            />
            <MyDateInput
              name="completion_date"
              label="تاریخ تکمیل"
              control={control}
              errMsg={errors.completion_date?.message}
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            اطلاعات مکان
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <MySingleSelect
                name="province"
                label="استان"
                loadOptions={loadProvinces}
                setValue={setValueWrapper}
                defaultOptions={true}
                errMsg={errors.province?.message}
              />
              <MySingleSelect
                name="city"
                label="شهر"
                loadOptions={loadCities}
                setValue={setValueWrapper}
                defaultOptions={true}
                errMsg={errors.city?.message}
              />
              <MySingleSelect
                name="road"
                label="جاده"
                loadOptions={loadRoads}
                setValue={setValueWrapper}
                defaultOptions={true}
                errMsg={errors.road?.message}
              />
              <MySingleSelect
                name="traffic_zone"
                label="منطقه ترافیک"
                loadOptions={loadTrafficZones}
                setValue={setValueWrapper}
                defaultOptions={true}
                errMsg={errors.traffic_zone?.message}
              />
              <MySingleSelect
                name="city_zone"
                label="منطقه شهری"
                loadOptions={loadCityZones}
                setValue={setValueWrapper}
                defaultOptions={true}
                errMsg={errors.city_zone?.message}
              />

              {/* Coordinate inputs */}
              <div className="grid grid-cols-2 gap-4">
                <MyInput
                  name="latitude"
                  label="عرض جغرافیایی"
                  type="text"
                  register={register}
                  errMsg={errors.latitude?.message}
                  placeholder="۳۱٫۳۰۴۶۶۱۷۹۲۹۳۳۱"
                />
                <MyInput
                  name="longitude"
                  label="طول جغرافیایی"
                  type="text"
                  register={register}
                  errMsg={errors.longitude?.message}
                  placeholder="۴۸٫۶۴۹۱۷۷۵۵۱۲۶۹۵"
                />
              </div>
            </div>

            {/* Map Display */}
            <div className="h-96">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                موقعیت در نقشه
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                مارکر را بکشید تا موقعیت حادثه را تنظیم کنید یا مختصات را با
                اعداد فارسی وارد کنید
              </p>
              {isClient && (
                <MapContainer
                  center={
                    [
                      watchedLat || 31.304661792933331,
                      watchedLng || 48.649177551269495,
                    ] as LatLngExpression
                  }
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                  className="rounded-lg z-10"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {watchedLat && watchedLng && (
                    <DraggableMarker
                      position={[watchedLat, watchedLng]}
                      onMove={handleMarkerMove}
                    />
                  )}
                </MapContainer>
              )}
            </div>
          </div>
        </div>

        {/* Road and Environment Conditions */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            شرایط جاده و محیط
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MyAsyncMultiSelect
              name="road_defects"
              label="نقص جاده"
              loadOptions={loadRoadDefects}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.road_defects?.message}
            />
            <MySingleSelect
              name="road_repair_type"
              label="نوع تعمیر جاده"
              loadOptions={loadRoadRepairTypes}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.road_repair_type?.message}
            />
            <MySingleSelect
              name="road_situation"
              label="وضعیت جاده"
              loadOptions={loadRoadSituations}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.road_situation?.message}
            />
            <MyAsyncMultiSelect
              name="road_surface_conditions"
              label="شرایط سطح جاده"
              loadOptions={loadRoadSurfaceConditions}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.road_surface_conditions?.message}
            />
            <MyAsyncMultiSelect
              name="air_statuses"
              label="وضعیت هوا"
              loadOptions={loadAirStatuses}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.air_statuses?.message}
            />
            <MySingleSelect
              name="light_status"
              label="وضعیت نور"
              loadOptions={loadLightStatuses}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.light_status?.message}
            />
            <MySingleSelect
              name="shoulder_status"
              label="وضعیت شانه جاده"
              loadOptions={loadShoulderStatuses}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.shoulder_status?.message}
            />
            <MySingleSelect
              name="position"
              label="موقعیت"
              loadOptions={loadPositions}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.position?.message}
            />
          </div>
        </div>

        {/* Accident Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            جزئیات حادثه
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MySingleSelect
              name="type"
              label="نوع حادثه"
              loadOptions={loadTypes}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.type?.message}
            />
            <MySingleSelect
              name="collision_type"
              label="نوع تصادف"
              loadOptions={loadCollisionTypes}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.collision_type?.message}
            />
            <MyAsyncMultiSelect
              name="area_usages"
              label="کاربری منطقه"
              loadOptions={loadAreaUsages}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.area_usages?.message}
            />
            <MySingleSelect
              name="ruling_type"
              label="نوع حکم"
              loadOptions={loadRulingTypes}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.ruling_type?.message}
            />
            <MyAsyncMultiSelect
              name="human_reasons"
              label="دلایل انسانی"
              loadOptions={loadHumanReasons}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.human_reasons?.message}
            />
            <MyAsyncMultiSelect
              name="vehicle_reasons"
              label="دلایل وسیله نقلیه"
              loadOptions={loadVehicleReasons}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.vehicle_reasons?.message}
            />
            <MyAsyncMultiSelect
              name="equipment_damages"
              label="آسیب تجهیزات"
              loadOptions={loadEquipmentDamages}
              setValue={setValueWrapper}
              defaultOptions={true}
              errMsg={errors.equipment_damages?.message}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="has_witness"
                {...register("has_witness")}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="has_witness"
                className="text-sm font-medium text-gray-700"
              >
                شاهد دارد
              </label>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              اطلاعات وسایل نقلیه
            </h2>
            <button
              type="button"
              onClick={addVehicle}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              افزودن وسیله نقلیه
            </button>
          </div>
          {vehicleFields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 mb-4 bg-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">
                  وسیله نقلیه {index + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removeVehicle(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  حذف
                </button>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <MySelectWithName
                  name={`vehicle_dtos.${index}.color`}
                  label="رنگ"
                  loadOptions={loadColors}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.system`}
                  label="سیستم"
                  loadOptions={loadSystems}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.plaque_type`}
                  label="نوع پلاک"
                  loadOptions={loadPlaqueTypes}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.plaque_usage`}
                  label="کاربری پلاک"
                  loadOptions={loadPlaqueUsages}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.system_type`}
                  label="نوع سیستم"
                  loadOptions={loadSystemTypes}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.fault_status`}
                  label="وضعیت تقصیر"
                  loadOptions={loadFaultStatuses}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.insurance_co`}
                  label="شرکت بیمه"
                  loadOptions={loadInsuranceCos}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.body_insurance_co`}
                  label="شرکت بیمه بدنه"
                  loadOptions={loadBodyInsuranceCos}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MySelectWithName
                  name={`vehicle_dtos.${index}.motion_direction`}
                  label="جهت حرکت"
                  loadOptions={loadMotionDirections}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
                <MyInput
                  name={`vehicle_dtos.${index}.insurance_no`}
                  label="شماره بیمه"
                  register={register}
                />
                <MyInput
                  name={`vehicle_dtos.${index}.body_insurance_no`}
                  label="شماره بیمه بدنه"
                  register={register}
                />
                <MyInput
                  name={`vehicle_dtos.${index}.print_number`}
                  label="شماره چاپ"
                  register={register}
                />
                <MyInput
                  name={`vehicle_dtos.${index}.insurance_warranty_limit`}
                  label="حد ضمانت بیمه"
                  type="number"
                  register={register}
                />
                <MyInput
                  name={`vehicle_dtos.${index}.damage_section_other`}
                  label="سایر آسیب‌ها"
                  register={register}
                />
              </div>

              {/* Driver Information */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-700 mb-3">
                  اطلاعات راننده
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MyInput
                    name={`vehicle_dtos.${index}.driver.first_name`}
                    label="نام"
                    register={register}
                    errMsg={
                      errors.vehicle_dtos?.[index]?.driver?.first_name?.message
                    }
                  />
                  <MyInput
                    name={`vehicle_dtos.${index}.driver.last_name`}
                    label="نام خانوادگی"
                    register={register}
                    errMsg={
                      errors.vehicle_dtos?.[index]?.driver?.last_name?.message
                    }
                  />
                  <MyInput
                    name={`vehicle_dtos.${index}.driver.national_code`}
                    label="کد ملی"
                    register={register}
                    errMsg={
                      errors.vehicle_dtos?.[index]?.driver?.national_code
                        ?.message
                    }
                  />
                  <select
                    {...register(`vehicle_dtos.${index}.driver.sex`)}
                    className="w-full px-4 py-3 text-slate-800 bg-white border border-slate-300 rounded-xl text-right"
                  >
                    <option value="Male">مرد</option>
                    <option value="Female">زن</option>
                    <option value="Other">سایر</option>
                  </select>
                  <MySelectWithName
                    name={`vehicle_dtos.${index}.driver.licence_type`}
                    label="نوع گواهینامه"
                    loadOptions={loadLicenceTypes}
                    setValue={handleSetValue}
                    defaultOptions={true}
                  />
                  <MyInput
                    name={`vehicle_dtos.${index}.driver.licence_number`}
                    label="شماره گواهینامه"
                    register={register}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pedestrian Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              اطلاعات عابران پیاده
            </h2>
            <button
              type="button"
              onClick={addPedestrian}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              افزودن عابر پیاده
            </button>
          </div>
          {pedestrianFields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 mb-4 bg-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">
                  عابر پیاده {index + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removePedestrian(index)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  حذف
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MyInput
                  name={`pedestrian_dtos.${index}.first_name`}
                  label="نام"
                  register={register}
                  errMsg={errors.pedestrian_dtos?.[index]?.first_name?.message}
                />
                <MyInput
                  name={`pedestrian_dtos.${index}.last_name`}
                  label="نام خانوادگی"
                  register={register}
                  errMsg={errors.pedestrian_dtos?.[index]?.last_name?.message}
                />
                <MyInput
                  name={`pedestrian_dtos.${index}.national_code`}
                  label="کد ملی"
                  register={register}
                  errMsg={
                    errors.pedestrian_dtos?.[index]?.national_code?.message
                  }
                />
                <select
                  {...register(`pedestrian_dtos.${index}.sex`)}
                  className="w-full px-4 py-3 text-slate-800 bg-white border border-slate-300 rounded-xl text-right"
                >
                  <option value="Male">مرد</option>
                  <option value="Female">زن</option>
                  <option value="Other">سایر</option>
                </select>
                <MySelectWithName
                  name={`pedestrian_dtos.${index}.fault_status`}
                  label="وضعیت تقصیر"
                  loadOptions={loadFaultStatuses}
                  setValue={handleSetValue}
                  defaultOptions={true}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/accident")}
            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "در حال ارسال..." : "ثبت حادثه"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormCreateAccident;
