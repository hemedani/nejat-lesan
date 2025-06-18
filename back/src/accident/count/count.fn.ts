import type { ActFn, Document } from "@deps";
import { accident } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
	const {
		set: {
			// Core Accident Details
			seri,
			serial,
			dateOfAccidentFrom,
			dateOfAccidentTo,
			deadCount,
			deadCountMin,
			deadCountMax,
			injuredCount,
			injuredCountMin,
			injuredCountMax,
			hasWitness,
			newsNumber,
			officer, // officer's name or identifier string
			completionDateFrom,
			completionDateTo,

			// Location & Context (filtering by name of embedded object)
			province,
			city,
			road,
			trafficZone,
			cityZone,
			accidentType, // type.name
			position, // position.name
			rulingType, // ruling_type.name
			lightStatus, // light_status.name
			collisionType, // collision_type.name
			roadSituation, // road_situation.name
			roadRepairType, // road_repair_type.name
			shoulderStatus, // shoulder_status.name

			polygon,

			// Environmental & Reason-based (array of names for multi-select on embedded arrays of objects)
			areaUsages, // area_usages[].name
			airStatuses, // air_statuses[].name
			roadDefects, // road_defects[].name
			humanReasons, // human_reasons[].name
			vehicleReasons, // vehicle_reasons[].name
			equipmentDamages, // equipment_damages[].name
			roadSurfaceConditions, // road_surface_conditions[].name

			// Attachments
			attachmentName, // attachments[].name
			attachmentType, // attachments[].type

			// Vehicle DTOs Filters (ANY vehicle matches)
			vehicleColor, // vehicle_dtos[].color.name
			vehicleSystem, // vehicle_dtos[].system.name
			vehiclePlaqueType, // vehicle_dtos[].plaque_type.name
			vehicleSystemType, // vehicle_dtos[].system_type.name
			vehicleFaultStatus, // vehicle_dtos[].fault_status.name
			vehicleInsuranceCo, // vehicle_dtos[].insurance_co.name
			vehicleInsuranceNo, // vehicle_dtos[].insurance_no
			vehiclePlaqueUsage, // vehicle_dtos[].plaque_usage.name
			vehiclePrintNumber, // vehicle_dtos[].print_number
			vehiclePlaqueSerialElement, // element in vehicle_dtos[].plaque_serial[]
			vehicleInsuranceDateFrom,
			vehicleInsuranceDateTo,
			vehicleBodyInsuranceCo, // vehicle_dtos[].body_insurance_co.name
			vehicleBodyInsuranceNo, // vehicle_dtos[].body_insurance_no
			vehicleMotionDirection, // vehicle_dtos[].motion_direction.name
			vehicleBodyInsuranceDateFrom,
			vehicleBodyInsuranceDateTo,
			vehicleMaxDamageSections, // vehicle_dtos[].max_damage_sections[].name (array of names)
			vehicleDamageSectionOther, // vehicle_dtos[].damage_section_other
			vehicleInsuranceWarrantyLimit,
			vehicleInsuranceWarrantyLimitMin,
			vehicleInsuranceWarrantyLimitMax,

			// Driver in Vehicle DTOs Filters (ANY driver in ANY vehicle matches)
			driverSex, // vehicle_dtos[].driver.sex
			driverFirstName, // vehicle_dtos[].driver.first_name
			driverLastName, // vehicle_dtos[].driver.last_name
			driverNationalCode, // vehicle_dtos[].driver.national_code
			driverLicenceNumber, // vehicle_dtos[].driver.licence_number
			driverLicenceType, // vehicle_dtos[].driver.licence_type.name
			driverInjuryType, // vehicle_dtos[].driver.injury_type.name
			driverTotalReason, // vehicle_dtos[].driver.total_reason.name

			// Passenger in Vehicle DTOs Filters (ANY passenger in ANY vehicle matches)
			passengerSex, // vehicle_dtos[].passenger_dtos[].sex
			passengerFirstName, // vehicle_dtos[].passenger_dtos[].first_name
			passengerLastName, // vehicle_dtos[].passenger_dtos[].last_name
			passengerNationalCode, // vehicle_dtos[].passenger_dtos[].national_code
			passengerInjuryType, // vehicle_dtos[].passenger_dtos[].injury_type.name
			passengerFaultStatus, // vehicle_dtos[].passenger_dtos[].fault_status.name
			passengerTotalReason, // vehicle_dtos[].passenger_dtos[].total_reason.name

			// Pedestrian DTOs Filters (ANY pedestrian matches)
			pedestrianSex, // pedestrian_dtos[].sex
			pedestrianFirstName, // pedestrian_dtos[].first_name
			pedestrianLastName, // pedestrian_dtos[].last_name
			pedestrianNationalCode, // pedestrian_dtos[].national_code
			pedestrianInjuryType, // pedestrian_dtos[].injury_type.name
			pedestrianFaultStatus, // pedestrian_dtos[].fault_status.name
			pedestrianTotalReason, // pedestrian_dtos[].total_reason.name
		},
		get,
	} = body.details;

	const filters: Document = {};

	// --- Core Accident Details ---
	if (seri !== undefined) filters.seri = seri;
	if (serial !== undefined) filters.serial = serial;
	if (dateOfAccidentFrom || dateOfAccidentTo) {
		filters.date_of_accident = {}; // Schema field: date_of_accident
		if (dateOfAccidentFrom) {
			filters.date_of_accident.$gte = new Date(dateOfAccidentFrom);
		}
		if (dateOfAccidentTo) {
			filters.date_of_accident.$lte = new Date(dateOfAccidentTo);
		}
	}
	if (deadCount !== undefined) filters.dead_count = deadCount; // Schema field: dead_count
	if (deadCountMin !== undefined) {
		filters.dead_count = {
			...filters.dead_count,
			$gte: deadCountMin,
		};
	}
	if (deadCountMax !== undefined) {
		filters.dead_count = {
			...filters.dead_count,
			$lte: deadCountMax,
		};
	}
	if (injuredCount !== undefined) {
		filters.injured_count = injuredCount; // Schema field: injured_count
	}
	if (injuredCountMin !== undefined) {
		filters.injured_count = {
			...filters.injured_count,
			$gte: injuredCountMin,
		};
	}
	if (injuredCountMax !== undefined) {
		filters.injured_count = {
			...filters.injured_count,
			$lte: injuredCountMax,
		};
	}
	if (hasWitness !== undefined) {
		filters.has_witness = hasWitness === "true"; // Schema field: has_witness
	}
	if (newsNumber !== undefined) filters.news_number = newsNumber; // Schema field: news_number
	if (officer) filters.officer = { $regex: new RegExp(officer, "i") }; // Schema field: officer
	if (completionDateFrom || completionDateTo) {
		filters.completion_date = {}; // Schema field: completion_date
		if (completionDateFrom) {
			filters.completion_date.$gte = new Date(completionDateFrom);
		}
		if (completionDateTo) {
			filters.completion_date.$lte = new Date(completionDateTo);
		}
	}

	// --- Location & Context (exact match on embedded object's 'name' field) ---
	if (province) filters["province.name"] = province;
	if (city) filters["city.name"] = city;
	if (road) filters["road.name"] = road;
	if (trafficZone) filters["traffic_zone.name"] = trafficZone;
	if (cityZone) filters["city_zone.name"] = cityZone;
	if (accidentType) filters["type.name"] = accidentType; // Schema field: type.name
	if (position) filters["position.name"] = position;
	if (rulingType) filters["ruling_type.name"] = rulingType;
	if (lightStatus) filters["light_status.name"] = lightStatus;
	if (collisionType) filters["collision_type.name"] = collisionType;
	if (roadSituation) filters["road_situation.name"] = roadSituation;
	if (roadRepairType) {
		filters["road_repair_type.name"] = roadRepairType;
	}
	if (shoulderStatus) {
		filters["shoulder_status.name"] = shoulderStatus;
	}

	// --- GeoJSON Location Filter ---
	if (polygon) {
		filters.location = {
			$geoIntersects: {
				$geometry: polygon,
			},
		};
	}

	// --- Environmental & Reason-based (match if embedded array contains any of the provided names) ---
	if (areaUsages && areaUsages.length > 0) {
		filters["area_usages.name"] = { $in: areaUsages };
	}
	if (airStatuses && airStatuses.length > 0) {
		filters["air_statuses.name"] = { $in: airStatuses };
	}
	if (roadDefects && roadDefects.length > 0) {
		filters["road_defects.name"] = { $in: roadDefects };
	}
	if (humanReasons && humanReasons.length > 0) {
		filters["human_reasons.name"] = { $in: humanReasons };
	}
	if (vehicleReasons && vehicleReasons.length > 0) {
		filters["vehicle_reasons.name"] = { $in: vehicleReasons };
	}
	if (equipmentDamages && equipmentDamages.length > 0) {
		filters["equipment_damages.name"] = { $in: equipmentDamages };
	}
	if (roadSurfaceConditions && roadSurfaceConditions.length > 0) {
		filters["road_surface_conditions.name"] = {
			$in: roadSurfaceConditions,
		};
	}

	// --- Attachments (if ANY attachment matches criteria) ---
	const attachmentElemMatch: any = {};
	if (attachmentName) {
		attachmentElemMatch.name = { $regex: new RegExp(attachmentName, "i") };
	}
	if (attachmentType) attachmentElemMatch.type = attachmentType;
	if (Object.keys(attachmentElemMatch).length > 0) {
		filters.attachments = { $elemMatch: attachmentElemMatch }; // Schema field: attachments
	}

	// --- Pedestrian DTOs Filters (if ANY pedestrian matches criteria) ---
	const pedestrianElemMatch: any = {};
	if (pedestrianSex) pedestrianElemMatch.sex = pedestrianSex;
	if (pedestrianFirstName) {
		pedestrianElemMatch.first_name = {
			$regex: new RegExp(pedestrianFirstName, "i"),
		}; // Schema: first_name
	}
	if (pedestrianLastName) {
		pedestrianElemMatch.last_name = {
			$regex: new RegExp(pedestrianLastName, "i"),
		}; // Schema: last_name
	}
	if (pedestrianNationalCode) {
		pedestrianElemMatch.national_code = pedestrianNationalCode; // Schema: national_code
	}
	if (pedestrianInjuryType) {
		pedestrianElemMatch["injury_type.name"] = pedestrianInjuryType; // Schema: injury_type.name
	}
	if (pedestrianFaultStatus) {
		pedestrianElemMatch["fault_status.name"] = pedestrianFaultStatus; // Schema: fault_status.name
	}
	if (pedestrianTotalReason) {
		pedestrianElemMatch["total_reason.name"] = pedestrianTotalReason; // Schema: total_reason.name
	}
	if (Object.keys(pedestrianElemMatch).length > 0) {
		filters.pedestrian_dtos = { $elemMatch: pedestrianElemMatch }; // Schema field: pedestrian_dtos
	}

	// --- Vehicle DTOs, Driver, and Passenger Filters (if ANY vehicle matches ALL specified vehicle/driver/passenger criteria for that vehicle) ---
	const vehicleElemMatch: any = {};

	// Direct vehicle properties
	if (vehicleColor) vehicleElemMatch["color.name"] = vehicleColor;
	if (vehicleSystem) vehicleElemMatch["system.name"] = vehicleSystem;
	if (vehiclePlaqueType) {
		vehicleElemMatch["plaque_type.name"] = vehiclePlaqueType;
	}
	if (vehicleSystemType) {
		vehicleElemMatch["system_type.name"] = vehicleSystemType;
	}
	if (vehicleFaultStatus) {
		vehicleElemMatch["fault_status.name"] = vehicleFaultStatus;
	}
	if (vehicleInsuranceCo) {
		vehicleElemMatch["insurance_co.name"] = vehicleInsuranceCo;
	}
	if (vehicleInsuranceNo) vehicleElemMatch.insurance_no = vehicleInsuranceNo;
	if (vehiclePlaqueUsage) {
		vehicleElemMatch["plaque_usage.name"] = vehiclePlaqueUsage;
	}
	if (vehiclePrintNumber) vehicleElemMatch.print_number = vehiclePrintNumber;
	if (vehiclePlaqueSerialElement) {
		vehicleElemMatch.plaque_serial = vehiclePlaqueSerialElement; // Matches if element is in array
	}
	if (vehicleInsuranceDateFrom || vehicleInsuranceDateTo) {
		vehicleElemMatch.insurance_date = {};
		if (vehicleInsuranceDateFrom) {
			vehicleElemMatch.insurance_date.$gte = new Date(
				vehicleInsuranceDateFrom,
			);
		}
		if (vehicleInsuranceDateTo) {
			vehicleElemMatch.insurance_date.$lte = new Date(
				vehicleInsuranceDateTo,
			);
		}
	}
	if (vehicleBodyInsuranceCo) {
		vehicleElemMatch["body_insurance_co.name"] = vehicleBodyInsuranceCo;
	}
	if (vehicleBodyInsuranceNo) {
		vehicleElemMatch.body_insurance_no = vehicleBodyInsuranceNo;
	}
	if (vehicleMotionDirection) {
		vehicleElemMatch["motion_direction.name"] = vehicleMotionDirection;
	}
	if (vehicleBodyInsuranceDateFrom || vehicleBodyInsuranceDateTo) {
		vehicleElemMatch.body_insurance_date = {};
		if (vehicleBodyInsuranceDateFrom) {
			vehicleElemMatch.body_insurance_date.$gte = new Date(
				vehicleBodyInsuranceDateFrom,
			);
		}
		if (vehicleBodyInsuranceDateTo) {
			vehicleElemMatch.body_insurance_date.$lte = new Date(
				vehicleBodyInsuranceDateTo,
			);
		}
	}
	if (vehicleMaxDamageSections && vehicleMaxDamageSections.length > 0) {
		vehicleElemMatch["max_damage_sections.name"] = {
			$in: vehicleMaxDamageSections,
		};
	}
	if (vehicleDamageSectionOther) {
		vehicleElemMatch.damage_section_other = {
			$regex: new RegExp(vehicleDamageSectionOther, "i"),
		};
	}
	if (vehicleInsuranceWarrantyLimit !== undefined) {
		vehicleElemMatch.insurance_warranty_limit =
			vehicleInsuranceWarrantyLimit;
	}
	if (vehicleInsuranceWarrantyLimitMin !== undefined) {
		vehicleElemMatch.insurance_warranty_limit = {
			...vehicleElemMatch.insurance_warranty_limit,
			$gte: vehicleInsuranceWarrantyLimitMin,
		};
	}
	if (vehicleInsuranceWarrantyLimitMax !== undefined) {
		vehicleElemMatch.insurance_warranty_limit = {
			...vehicleElemMatch.insurance_warranty_limit,
			$lte: vehicleInsuranceWarrantyLimitMax,
		};
	}

	// Driver properties (applied to the driver object within the vehicle)
	if (driverSex) vehicleElemMatch["driver.sex"] = driverSex;
	if (driverFirstName) {
		vehicleElemMatch["driver.first_name"] = {
			$regex: new RegExp(driverFirstName, "i"),
		};
	}
	if (driverLastName) {
		vehicleElemMatch["driver.last_name"] = {
			$regex: new RegExp(driverLastName, "i"),
		};
	}
	if (driverNationalCode) {
		vehicleElemMatch["driver.national_code"] = driverNationalCode;
	}
	if (driverLicenceNumber) {
		vehicleElemMatch["driver.licence_number"] = driverLicenceNumber;
	}
	if (driverLicenceType) {
		vehicleElemMatch["driver.licence_type.name"] = driverLicenceType;
	}
	if (driverInjuryType) {
		vehicleElemMatch["driver.injury_type.name"] = driverInjuryType;
	}
	if (driverTotalReason) {
		vehicleElemMatch["driver.total_reason.name"] = driverTotalReason;
	}

	// Passenger properties (nested $elemMatch for passenger_dtos within the vehicle)
	const passengerElemMatchForVehicle: any = {};
	if (passengerSex) passengerElemMatchForVehicle.sex = passengerSex;
	if (passengerFirstName) {
		passengerElemMatchForVehicle.first_name = {
			$regex: new RegExp(passengerFirstName, "i"),
		};
	}
	if (passengerLastName) {
		passengerElemMatchForVehicle.last_name = {
			$regex: new RegExp(passengerLastName, "i"),
		};
	}
	if (passengerNationalCode) {
		passengerElemMatchForVehicle.national_code = passengerNationalCode;
	}
	if (passengerInjuryType) {
		passengerElemMatchForVehicle["injury_type.name"] = passengerInjuryType;
	}
	if (passengerFaultStatus) {
		passengerElemMatchForVehicle["fault_status.name"] =
			passengerFaultStatus;
	}
	if (passengerTotalReason) {
		passengerElemMatchForVehicle["total_reason.name"] =
			passengerTotalReason;
	}

	if (Object.keys(passengerElemMatchForVehicle).length > 0) {
		vehicleElemMatch.passenger_dtos = {
			$elemMatch: passengerElemMatchForVehicle,
		};
	}

	// If any vehicle-related criteria were added, include the $elemMatch for vehicle_dtos
	if (Object.keys(vehicleElemMatch).length > 0) {
		filters.vehicle_dtos = { $elemMatch: vehicleElemMatch }; // Schema field: vehicle_dtos
	}

	const foundedItemsLength = await accident.countDocument({
		filter: filters,
	});

	const totalItems = await accident.countDocument({
		filter: {},
	});

	return { filtered: foundedItemsLength, total: totalItems };
};
