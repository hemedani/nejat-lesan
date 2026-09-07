import { coreApp } from "../mod.ts";
import { array, boolean, object, string } from "@deps";
import { createUpdateAt } from "../utils/createUpdateAt.ts";

/**
 * ModuleConfig — پیکربندی ماژول‌های فعال این نصب (فقط توسط Ghost تنظیم می‌شود).
 * یک سند تکی با `key: "app_modules"`. ساخته‌شده در اولین بوت از ENABLED_MODULES
 * (پیش‌فرض: همه فعال) و پس از آن فقط از طریق اکشن Ghost تغییر می‌کند.
 */
export const module_config_pure = {
	key: string(),
	modules: array(object({
		key: string(),
		enabled: boolean(),
	})),
	...createUpdateAt,
};

export const module_config_relations = {};

export const module_configs = () =>
	coreApp.odm.newModel(
		"module_config",
		module_config_pure,
		module_config_relations,
	);
