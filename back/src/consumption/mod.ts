import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { countSetup } from "./count/mod.ts";

export const consumptionSetup = () => {
	addSetup();
	getSetup();
	getsSetup();
	countSetup();
};
