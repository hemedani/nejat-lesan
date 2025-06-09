import type { ActFn } from "@deps";
import {
	accident,
	air_status,
	area_usage,
	body_insurance_co,
	city,
	collision_type,
	color,
	equipment_damage,
	fault_status,
	human_reason,
	insurance_co,
	licence_type,
	light_status,
	max_damage_section,
	motion_direction,
	plaque_type,
	plaque_usage,
	position,
	province,
	road,
	road_defect,
	road_repair_type,
	road_situation,
	road_surface_condition,
	ruling_type,
	shoulder_status,
	system,
	system_type,
	type,
	user,
	vehicle_reason,
} from "../../../mod.ts";

export const dashboardStatisticFn: ActFn = async () => {
	const users = await user.countDocument({});
	const provinces = await province.countDocument({});
	const cities = await city.countDocument({});
	const accidents = await accident.countDocument({}); // Added await

	// Counting all other imported models
	const airStatuses = await air_status.countDocument({});
	const areaUsages = await area_usage.countDocument({});
	const bodyInsuranceCos = await body_insurance_co.countDocument({});
	const collisionTypes = await collision_type.countDocument({});
	const colors = await color.countDocument({});
	const equipmentDamages = await equipment_damage.countDocument({});
	const faultStatuses = await fault_status.countDocument({});
	const humanReasons = await human_reason.countDocument({});
	const insuranceCos = await insurance_co.countDocument({});
	const licenceTypes = await licence_type.countDocument({});
	const lightStatuses = await light_status.countDocument({});
	const maxDamageSections = await max_damage_section.countDocument({});
	const motionDirections = await motion_direction.countDocument({});
	const plaqueTypes = await plaque_type.countDocument({});
	const plaqueUsages = await plaque_usage.countDocument({});
	const positions = await position.countDocument({});
	const roads = await road.countDocument({});
	const roadDefects = await road_defect.countDocument({});
	const roadRepairTypes = await road_repair_type.countDocument({});
	const roadSituations = await road_situation.countDocument({});
	const roadSurfaceConditions = await road_surface_condition.countDocument(
		{},
	);
	const rulingTypes = await ruling_type.countDocument({});
	const shoulderStatuses = await shoulder_status.countDocument({});
	const systems = await system.countDocument({});
	const systemTypes = await system_type.countDocument({});
	const types = await type.countDocument({});
	const vehicleReasons = await vehicle_reason.countDocument({});

	return {
		users,
		provinces,
		cities,
		accidents,
		airStatuses,
		areaUsages,
		bodyInsuranceCos,
		collisionTypes,
		colors,
		equipmentDamages,
		faultStatuses,
		humanReasons,
		insuranceCos,
		licenceTypes,
		lightStatuses,
		maxDamageSections,
		motionDirections,
		plaqueTypes,
		plaqueUsages,
		positions,
		roads,
		roadDefects,
		roadRepairTypes,
		roadSituations,
		roadSurfaceConditions,
		rulingTypes,
		shoulderStatuses,
		systems,
		systemTypes,
		types,
		vehicleReasons,
	};
};
