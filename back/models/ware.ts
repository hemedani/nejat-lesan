import { coreApp } from "../mod.ts";
import {
	boolean,
	defaulted,
	type RelationDataType,
	number,
	optional,
	string,
} from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";
import {
	createSharedRelations,
	shared_relation_pure,
} from "./utils/sharedRelaions.ts";

/**
 * Ware — اقلام قابل انبارش (کاتالوگ تخت).
 *
 * D9 decided: flat catalog (no ware_type/class/group/model models).
 * The taxonomy levels are plain name fields so the product can still be
 * tagged/filtered without a hierarchy of models. `ware_model` doubles as the
 * SKU-ish reference used by inventory reports.
 *
 * JIT (Phase 5): `lead_time_days` (supplier lead time) is already here so no
 * schema change is needed later.
 */
export const ware_pure = {
	...shared_relation_pure,
	enName: optional(string()),
	brand: optional(string()),
	price: optional(number()),
	irc: optional(string()), // کد رهگیری ایرانی
	gtin: optional(string()), // شابک/بارکد جهانی
	photo_url: optional(string()),
	// --- flat taxonomy (plain name fields, no hierarchy models) ---
	ware_type: optional(string()), // تجهیزات ایمنی، علائم و تابلو، روشنایی، ...
	ware_class: optional(string()),
	ware_group: optional(string()),
	ware_model: optional(string()), // SKU-ish ref used by inventory reports
	manufacturer: optional(string()),
	// JIT (Phase 5): lead time in days for reorder-point computation
	lead_time_days: optional(number()),
	is_active: defaulted(boolean(), true),
};

export const ware_relations = createSharedRelations();

export const wares = () => {
	const model = coreApp.odm.newModel("ware", ware_pure, ware_relations, {
		createIndex: {
			indexSpec: { name: "text", enName: "text", brand: "text" },
		},
	});
	return model;
};
