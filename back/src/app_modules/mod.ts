import { getModulesSetup } from "./getModules/mod.ts";
import { setModulesSetup } from "./setModules/mod.ts";

export const appModulesSetup = () => {
	getModulesSetup();
	setModulesSetup();
};
