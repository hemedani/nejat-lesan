import { mapAccidentsSetup } from "./mapAccidents/mod.ts";
import { nearbyAccidentsSetup } from "./nearbyAccidents/mod.ts";

export const mapSetup = () => {
	mapAccidentsSetup();
	nearbyAccidentsSetup();
};
