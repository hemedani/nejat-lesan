import { getEmergencySetup } from "./get/mod.ts";
import { getEmergenciesSetup } from "./gets/mod.ts";
import { registerEmergencySetup } from "./register/mod.ts";
import { updateEmergencyStatusSetup } from "./updateStatus/mod.ts";

export const emergencySetup = () => {
	registerEmergencySetup();
	getEmergencySetup();
	getEmergenciesSetup();
	updateEmergencyStatusSetup();
};
