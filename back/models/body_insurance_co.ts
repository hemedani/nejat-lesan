import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const body_insurance_coes = () =>
	coreApp.odm.newModel(
		"body_insurance_co",
		shared_relation_pure,
		createSharedRelations(),
	);
