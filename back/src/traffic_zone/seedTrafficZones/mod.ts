/**
 * -----------------------------------------------------------------------------
 * FILE: seedTrafficZones.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "seedTrafficZones" act. This is a one-time utility function to
 * populate the database with traffic/air-pollution layer zones from a GeoJSON
 * file and link existing accidents to them.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { seedTrafficZonesFn } from "./seedTrafficZones.fn.ts";
import { seedTrafficZonesValidator } from "./seedTrafficZones.val.ts";
import { coreApp } from "../../../mod.ts";

export const seedTrafficZonesSetup = () =>
	coreApp.acts.setAct({
		schema: "traffic_zone", // The primary schema this act operates on
		fn: seedTrafficZonesFn,
		actName: "seedTrafficZones",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: seedTrafficZonesValidator(),
	});
