import { fileSetup } from "./file/mod.ts";
import { userSetup } from "./user/mod.ts";
import { citySetup } from "./city/mod.ts";
import { provinceSetup } from "./province/mod.ts";
import { axesSetup } from "./axes/mod.ts";
import { policeStationSetup } from "./police_station/mod.ts";

export const functionsSetup = () => {
	userSetup();
	fileSetup();
	citySetup();
	provinceSetup();
	axesSetup();
	policeStationSetup();
};
