import { array, enums, number, object, optional, string } from "@deps";
import { geoJSONStruct } from "@model";

export const countValidator = () => {
	return object({
		set: object({
			// --- Core Accident Details ---
			seri: optional(number()),
			serial: optional(number()),
			dateOfAccidentFrom: optional(string()), // Was: date_of_accident_from
			dateOfAccidentTo: optional(string()), // Was: date_of_accident_to
			deadCount: optional(number()), // Was: dead_count
			deadCountMin: optional(number()), // Was: dead_count_min
			deadCountMax: optional(number()), // Was: dead_count_max
			injuredCount: optional(number()), // Was: injured_count
			injuredCountMin: optional(number()), // Was: injured_count_min
			injuredCountMax: optional(number()), // Was: injured_count_max
			hasWitness: optional(string()), // Was: has_witness (e.g., "true" or "false")
			newsNumber: optional(number()), // Was: news_number
			officer: optional(string()),
			completionDateFrom: optional(string()), // Was: completion_date_from
			completionDateTo: optional(string()), // Was: completion_date_to

			// --- Location & Context (filtering by name) ---
			province: optional(array(string())),
			city: optional(array(string())),
			road: optional(array(string())),
			trafficZone: optional(array(string())), // Was: traffic_zone
			cityZone: optional(array(string())), // Was: city_zone
			accidentType: optional(array(string())), // Was: accident_type
			position: optional(array(string())),
			rulingType: optional(array(string())), // Was: ruling_type
			lightStatus: optional(array(string())), // Was: light_status
			collisionType: optional(array(string())), // Was: collision_type
			roadSituation: optional(array(string())), // Was: road_situation
			roadRepairType: optional(array(string())), // Was: road_repair_type
			shoulderStatus: optional(array(string())), // Was: shoulder_status

			// ---  GeoJSON ---
			polygon: optional(geoJSONStruct("Polygon")), // Was: location

			// --- Environmental & Reason-based (array of names for multi-select) ---
			areaUsages: optional(array(string())), // Was: area_usages
			airStatuses: optional(array(string())), // Was: air_statuses
			roadDefects: optional(array(string())), // Was: road_defects
			humanReasons: optional(array(string())), // Was: human_reasons
			vehicleReasons: optional(array(string())), // Was: vehicle_reasons
			equipmentDamages: optional(array(string())), // Was: equipment_damages
			roadSurfaceConditions: optional(array(string())), // Was: road_surface_conditions

			// --- Attachments ---
			attachmentName: optional(string()), // Was: attachment_name
			attachmentType: optional(string()), // Was: attachment_type

			// --- Vehicle DTOs Filters (applied if ANY vehicle in the accident matches) ---
			vehicleColor: optional(array(string())), // Was: vehicle_color
			vehicleSystem: optional(array(string())), // Was: vehicle_system
			vehiclePlaqueType: optional(array(string())), // Was: vehicle_plaque_type
			vehicleSystemType: optional(array(string())), // Was: vehicle_system_type
			vehicleFaultStatus: optional(array(string())), // Was: vehicle_fault_status
			vehicleInsuranceCo: optional(array(string())), // Was: vehicle_insurance_co
			vehicleInsuranceNo: optional(string()), // Was: vehicle_insurance_no
			vehiclePlaqueUsage: optional(array(string())), // Was: vehicle_plaque_usage
			vehiclePrintNumber: optional(string()), // Was: vehicle_print_number
			vehiclePlaqueSerialElement: optional(string()), // Was: vehicle_plaque_serial_element
			vehicleInsuranceDateFrom: optional(string()), // Was: vehicle_insurance_date_from
			vehicleInsuranceDateTo: optional(string()), // Was: vehicle_insurance_date_to
			vehicleBodyInsuranceCo: optional(array(string())), // Was: vehicle_body_insurance_co
			vehicleBodyInsuranceNo: optional(string()), // Was: vehicle_body_insurance_no
			vehicleMotionDirection: optional(array(string())), // Was: vehicle_motion_direction
			vehicleBodyInsuranceDateFrom: optional(string()), // Was: vehicle_body_insurance_date_from
			vehicleBodyInsuranceDateTo: optional(string()), // Was: vehicle_body_insurance_date_to
			vehicleMaxDamageSections: optional(array(string())), // Was: vehicle_max_damage_sections
			vehicleDamageSectionOther: optional(string()), // Was: vehicle_damage_section_other
			vehicleInsuranceWarrantyLimit: optional(number()), // Was: vehicle_insurance_warranty_limit
			vehicleInsuranceWarrantyLimitMin: optional(number()), // Was: vehicle_insurance_warranty_limit_min
			vehicleInsuranceWarrantyLimitMax: optional(number()), // Was: vehicle_insurance_warranty_limit_max

			// --- Driver in Vehicle DTOs Filters (applied if ANY driver in ANY vehicle matches) ---
			driverSex: optional(array(string())), // Was: driver_sex
			driverFirstName: optional(string()), // Was: driver_first_name
			driverLastName: optional(string()), // Was: driver_last_name
			driverNationalCode: optional(string()), // Was: driver_national_code
			driverLicenceNumber: optional(string()), // Was: driver_licence_number
			driverLicenceType: optional(array(string())), // Was: driver_licence_type
			driverInjuryType: optional(array(string())), // Was: driver_injury_type
			driverTotalReason: optional(array(string())), // Was: driver_total_reason

			// --- Passenger in Vehicle DTOs Filters (applied if ANY passenger in ANY vehicle matches) ---
			passengerSex: optional(array(string())),
			passengerFirstName: optional(string()), // Was: passenger_first_name
			passengerLastName: optional(string()), // Was: passenger_last_name
			passengerNationalCode: optional(string()), // Was: passenger_national_code
			passengerInjuryType: optional(array(string())), // Was: passenger_injury_type
			passengerFaultStatus: optional(array(string())), // Was: passenger_fault_status
			passengerTotalReason: optional(array(string())), // Was: passenger_total_reason

			// --- Pedestrian DTOs Filters (applied if ANY pedestrian matches) ---
			pedestrianSex: optional(array(string())),
			pedestrianFirstName: optional(string()), // Was: pedestrian_first_name
			pedestrianLastName: optional(string()), // Was: pedestrian_last_name
			pedestrianNationalCode: optional(string()), // Was: pedestrian_national_code
			pedestrianInjuryType: optional(array(string())), // Was: pedestrian_injury_type
			pedestrianFaultStatus: optional(array(string())), // Was: pedestrian_fault_status
			pedestrianTotalReason: optional(array(string())), // Was: pedestrian_total_reason
		}),
		get: object({
			total: optional(enums([0, 1])),
			filtered: optional(enums([0, 1])),
		}),
	});
};
