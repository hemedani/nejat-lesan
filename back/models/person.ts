import { coreApp } from "../mod.ts";
import {
	// boolean,
	// date,
	enums,
	number,
	type RelationDataType,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
// import { geoJSONStruct } from "./province.ts";

export const person_pure = {
	person_type: enums(["driver", "passenger", "pedestrian", "biker"]), // the role of the person in the accident (driver, passenger, pedestrian, or biker)
	sex: enums(["Male", "Female"]), // the biological sex of the person
	// is_identity: boolean(), // whether the person's identity is confirmed (true/false)

	national_code: string(), // the national ID number for each person with string format, it's unique for every user
	first_name: string(), // the first name of the person
	last_name: string(), // the last name of the person
	// father_name: string(), // the father's name of the person
	// age: number(), // the age of the person in years

	licence_number: number(),
	// licence_type: enums([
	// 	"motorcycle",
	// 	"grade_three",
	// 	"grade_two",
	// 	"grade_one",
	// 	"special",
	// 	"unknown",
	// 	"no_licence",
	// 	"not_seen",
	// ]),
	// date_licence_issue: date(),
	// place_licence_issue: string(),
	// licence_category: string(),
	// licence_status: string(),
	// is_driver_licence_incompatibility: boolean(),

	// education: string(), // the highest education level attained by the person
	// job: string(), // the occupation or job title of the person
	// clothes_color: string(), // the color of the clothes the person was wearing at the time of the accident
	// average_speed: number(), // the average speed of the person or their vehicle (if applicable) at the time of the accident
	// throw_distance: number(), // the distance (in meters) the person was thrown during the accident
	// situation: string(), // the situation or condition of the person at the scene (e.g., conscious, unconscious)
	// transfer_method: string(), // the method used to transfer the person from the scene (e.g., ambulance, private car)
	// ambulance_code: string(), // the code or identifier of the ambulance used for transfer (if applicable)
	// cause_percent: string(), // the percentage indicating the person's contribution to the cause of the accident
	// injury_type: string(), // the type of injury sustained by the person
	// injury_at_scene: string(), // the injury status of the person at the scene (e.g., minor, severe)
	// safety_equipment: string(), // the safety equipment used by the person (e.g., seatbelt, helmet)
	// seating_position: string(), // the seating position of the person in the vehicle (if applicable)
	// trajectory: geoJSONStruct("LineString"), // the trajectory of the person during the accident, represented as a GeoJSON LineString

	...createUpdateAt, // fields for createdAt and updatedAt timestamps
};

export const person_relations = {
	registrer: {
		schemaName: "user",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {},
	},
	licence_type: {
		schemaName: "licence_type",
		type: "single" as RelationDataType,
		optional: true,
		relatedRelations: {},
	},
};

export const persons = () =>
	coreApp.odm.newModel(
		"person",
		person_pure,
		person_relations,
	);
