import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { adjustSetup } from "./adjust/mod.ts";
import { transferSetup } from "./transfer/mod.ts";
import { countSetup } from "./count/mod.ts";
import { getWarehouseInventorySetup } from "./getWarehouseInventory/mod.ts";
import { checkReorderSetup } from "./checkReorder/mod.ts";

export const inventorySetup = () => {
	addSetup();
	adjustSetup();
	transferSetup();
	getSetup();
	getsSetup();
	countSetup();
	getWarehouseInventorySetup();
	checkReorderSetup();
};
