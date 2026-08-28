import { lesan, MongoClient, redis } from "@deps";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import {
	accidents,
	air_pollution_zones,
	air_statuses,
	announcement_reads,
	announcements,
	area_usages,
	body_insurance_coes,
	cities,
	city_zones,
	collision_types,
	colors,
	croquis_types,
	damage_severities,
	devices,
	driver_statuses,
	emergencies,
	equipment_damages,
	events,
	fault_statuses,
	files,
	human_reasons,
	injury_statuses,
	insurance_coes,
	licence_types,
	light_statuses,
	max_damage_sections,
	motion_directions,
	operation_logs,
	patrol_operationss,
	patrol_units,
	person_roles,
	plaque_types,
	plaque_usages,
	police_stations,
	positions,
	provinces,
	road_defects,
	road_repair_types,
	road_situations,
	road_surface_conditions,
	roads,
	ruling_types,
	shifts,
	shoulder_statuses,
	system_types,
	systems,
	townships,
	traffic_zones,
	types,
	users,
	vehicle_final_statuses,
	vehicle_reasons,
	vehicle_types,
	vehicles,
} from "@model";
import { functionsSetup } from "./src/mod.ts";

const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/";
const REDIS_URI = Deno.env.get("REDIS_URI");

type RedisClient = Awaited<ReturnType<typeof redis.connect>>;

let redisClient: RedisClient | undefined;

export const getRedis = async (): Promise<RedisClient> => {
	if (!redisClient) {
		redisClient = await redis.connect({
			hostname: REDIS_URI ? "redis" : "127.0.0.1",
			port: 6379,
		});
	}
	return redisClient;
};

export const coreApp = lesan();
const client = await new MongoClient(MONGO_URI).connect();
// نام دیتابیس قابل تنظیم است؛ برای تست‌های ایزوله DB_NAME را تغییر دهید.
const DB_NAME = Deno.env.get("DB_NAME") || "nejat";
const db = client.db(DB_NAME);
coreApp.odm.setDb(db);

export const user = users();
export const device = devices();
export const file = files();
export const police_station = police_stations();
export const vehicle_type = vehicle_types();
export const croquis_type = croquis_types();
export const vehicle_final_status = vehicle_final_statuses();
export const driver_status = driver_statuses();
export const injury_status = injury_statuses();
export const person_role = person_roles();
export const damage_severity = damage_severities();
export const announcement = announcements();
export const province = provinces();
export const city = cities();
export const township = townships();
export const traffic_zone = traffic_zones();
export const air_pollution_zone = air_pollution_zones();
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
export const vehicle = vehicles();
export const patrol_unit = patrol_units();
export const shift = shifts();
export const patrol_operations = patrol_operationss();
export const operation_log = operation_logs();
export const announcement_read = announcement_reads();
export const emergency = emergencies();

export const { setAct, setService, getAtcsWithServices } = coreApp.acts;

export const { selectStruct, getSchemas } = coreApp.schemas;

export const event = events();

functionsSetup();

// Ensure uploads directory exists
try {
	await ensureDir("./uploads");
	console.log("Uploads directory ready");
} catch (error) {
	console.error("Failed to create uploads directory:", error);
}

// Environment variables for server configuration
const PORT = parseInt(Deno.env.get("SERVER_PORT") || "1404");
const TYPE_GENERATION =
	(Deno.env.get("TYPE_GENERATION") || "true").toLowerCase() !== "false";
const PLAYGROUND =
	(Deno.env.get("PLAYGROUND") || "true").toLowerCase() !== "false";
const CORS_ORIGINS_RAW = Deno.env.get("CORS_ORIGINS");
const CORS_ORIGINS = CORS_ORIGINS_RAW
	? CORS_ORIGINS_RAW.split(",").map((origin) => origin.trim())
	: [
		"http://localhost:3000",
		"http://localhost:4000",
		"http://frontend:3000",
		"http://lesan-frontend-1:3000",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:4000",
		"http://46.245.98.10:3795",
		"https://46.245.98.10:3795",
		"http://46.245.98.10",
		"https://46.245.98.10",
	];

coreApp.runServer({
	port: PORT,
	typeGeneration: TYPE_GENERATION,
	playground: PLAYGROUND,
	staticPath: ["/uploads"],
	cors: CORS_ORIGINS,
});
