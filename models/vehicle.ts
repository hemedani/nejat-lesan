import { coreApp } from "../mod.ts";
import {
	array,
	boolean,
	coerce,
	date,
	defaulted,
	enums,
	number,
	optional,
	pattern,
	refine,
	type RelationDataType,
	RelationSortOrderType,
	string,
} from "@deps";

export const vehiclePure = {
	color: string(),
	system: string(),
	plaqueNo: array(string()),
	plaqueType: string(),
	systemType: string(),
	faultStatus: string(),
	insuranceCo: string(),
	insuranceNo: string(),
	plaqueUsage: string(),
	printNumber: string(),
	plaqueSerial: array(string()),
	insuranceDate: date(),
	bodyInsuranceCo: string(),
	bodyInsuranceNo: string(),
	motionDirection: string(),
	bodyInsuranceDate: date(),
	maxDamageSections: array(string()),
	damageSectionOther: string(),
	insuranceWarrantyLimit: number(),
};

export const vehicleRelations = {
	driver: {
		schemaName: "driver",
		type: "single" as RelationDataType,
		optional: false,
		relatedRelations: {
			vehicles: {
				type: "multiple" as RelationDataType,
				limit: 50,
				sort: {
					field: "_id",
					order: "desc" as RelationSortOrderType,
				},
			},
		},
	},
};

export const vehicles = () =>
	coreApp.odm.newModel("vehicle", vehiclePure, vehicleRelations);
