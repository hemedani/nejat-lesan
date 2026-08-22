import { coreApp } from "../mod.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

export const croquis_types = () =>
	coreApp.odm.newModel(
		"croquis_type",
		shared_relation_pure,
		createSharedRelations(),
	);