import { addVehicleSetup } from "./add/mod.ts";
import { getVehicleSetup } from "./get/mod.ts";
import { getVehiclesSetup } from "./gets/mod.ts";
import { updateVehicleSetup } from "./update/mod.ts";
import { removeVehicleSetup } from "./remove/mod.ts";

export const vehicleSetup = () => {
	addVehicleSetup();
	updateVehicleSetup();
	getVehicleSetup();
	getVehiclesSetup();
	removeVehicleSetup();
};
