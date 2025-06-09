import { lesan, MongoClient, redis } from "@deps";
import {
	accidents,
	air_statuses,
	area_usages,
	body_insurance_coes,
	cities,
	city_zones,
	collision_types,
	colors,
	equipment_damages,
	fault_statuses,
	files,
	human_reasons,
	insurance_coes,
	licence_types,
	light_statuses,
	max_damage_sections,
	motion_directions,
	plaque_types,
	plaque_usages,
	positions,
	provinces,
	road_defects,
	road_repair_types,
	road_situations,
	road_surface_conditions,
	roads,
	ruling_types,
	shoulder_statuses,
	system_types,
	systems,
	traffic_zones,
	types,
	users,
	vehicle_reasons,
} from "@model";
import { functionsSetup } from "./src/mod.ts";

const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/";
const REDIS_URI = Deno.env.get("REDIS_URI");

export const myRedis = await redis.connect({
	hostname: REDIS_URI ? "redis" : "127.0.0.1",
	port: 6379,
});

export const coreApp = lesan();
const client = await new MongoClient(MONGO_URI).connect();
const db = client.db("nejat");
coreApp.odm.setDb(db);

export const user = users();
export const file = files();
export const province = provinces();
export const city = cities();
export const traffic_zone = traffic_zones();
export const city_zone = city_zones();
export const accident = accidents();
export const air_status = air_statuses();
export const area_usage = area_usages();
export const body_insurance_co = body_insurance_coes();
export const collision_type = collision_types();
export const color = colors();
export const equipment_damage = equipment_damages();
export const fault_status = fault_statuses();
export const human_reason = human_reasons();
export const insurance_co = insurance_coes();
export const licence_type = licence_types();
export const light_status = light_statuses();
export const max_damage_section = max_damage_sections();
export const motion_direction = motion_directions();
export const plaque_type = plaque_types();
export const plaque_usage = plaque_usages();
export const position = positions();
export const road = roads();
export const road_defect = road_defects();
export const road_repair_type = road_repair_types();
export const road_situation = road_situations();
export const road_surface_condition = road_surface_conditions();
export const ruling_type = ruling_types();
export const shoulder_status = shoulder_statuses();
export const system = systems();
export const system_type = system_types();
export const type = types();
export const vehicle_reason = vehicle_reasons();

export const { setAct, setService, getAtcsWithServices } = coreApp.acts;

export const { selectStruct, getSchemas } = coreApp.schemas;

functionsSetup();

coreApp.runServer({
	port: 1404,
	typeGeneration: true,
	playground: true,
	staticPath: ["/uploads"],
	cors: [
		"http://localhost:3000",
		"http://localhost:4000",
	],
});
