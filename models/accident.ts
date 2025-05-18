import { coreApp } from "../mod.ts";
import { array, boolean, date, number, string } from "@deps";

export const accidentPure = {
	road: string(),
	seri: string(),
	type: string(),
	officer: string(),
	position: string(),
	province: string(),
	serialNO: number(),
	township: string(),
	deadCount: number(),
	xPosition: number(),
	yPosition: number(),
	areaUsages: array(string()),
	hasWitness: boolean(),
	newsNumber: string(),
	rulingType: string(),
	airStatuses: array(string()),
	attachments: [AttachmentSchema],
	lightStatus: string(),
	roadDefects: array(string()),
	vehicleDTOS: [VehicleSchema],
	accidentDate: date(),
	base64Images: array(string()),
	humanReasons: array(string()),
	injuredCount: number(),
	collisionType: string(),
	roadSituation: string(),
	completionDate: date(),
	roadRepairType: string(),
	shoulderStatus: date(),
	vehicleReasons: array(string()),
	equipmentDamages: array(string()),
	roadSurfaceConditions: array(string()),
	pedestrianDTOS: [PedestrianSchema],
};

export const accidentRelations = {};

export const accidents = () =>
	coreApp.odm.newModel("accident", accidentPure, accidentRelations);
