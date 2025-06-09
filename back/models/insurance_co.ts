import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const insurance_coes = () =>
	coreApp.odm.newModel(
		"insurance_co",
		shared_relation_pure,
		createSharedRelations(),
	);
