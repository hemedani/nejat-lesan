import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getWarehouseInventoryFn } from "./getWarehouseInventory.fn.ts";
import { getWarehouseInventoryValidator } from "./getWarehouseInventory.val.ts";

export const getWarehouseInventorySetup = () =>
	coreApp.acts.setAct({
		schema: "inventory",
		fn: getWarehouseInventoryFn,
		actName: "getWarehouseInventory",
		preAct: [setTokens, setUser],
		validator: getWarehouseInventoryValidator(),
	});
