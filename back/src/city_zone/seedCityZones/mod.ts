/**
 * -----------------------------------------------------------------------------
 * FILE: seedCityZones.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "seedCityZones" act. This is a one-time utility function to
 * populate the database with city zones from a GeoJSON file and link existing
 * accidents to them.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { seedCityZonesFn } from "./seedCityZones.fn.ts";
import { seedCityZonesValidator } from "./seedCityZones.val.ts";
import { coreApp } from "../../../mod.ts";

export const seedCityZonesSetup = () =>
	coreApp.acts.setAct({
		schema: "city_zone", // The primary schema this act operates on
		fn: seedCityZonesFn,
		actName: "seedCityZones",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"], // Seeding should be an admin-level task
			}),
		],
		validator: seedCityZonesValidator(),
	});
