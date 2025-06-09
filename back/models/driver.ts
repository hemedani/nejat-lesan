import { coreApp } from "../mod.ts";
import { string } from "@deps";

export const driverPure = {
	sex: string(),
	lastName: string(),
	firstName: string(),
	injuryType: string(),
	licenceType: string(),
	nationalCode: string(),
	licenceNumber: string(),
	totalReason: string(),
};

export const driverRelations = {};

export const drivers = () =>
	coreApp.odm.newModel("driver", driverPure, driverRelations);
