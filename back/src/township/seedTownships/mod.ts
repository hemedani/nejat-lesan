/**
 * -----------------------------------------------------------------------------
 * FILE: seedTownships.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "seedTownships" act. This is a one-time utility function to
 * populate the database with townships from a GeoJSON file and link existing
 * accidents to them.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { seedTownshipsFn } from "./seedTownships.fn.ts";
import { seedTownshipsValidator } from "./seedTownships.val.ts";
import { coreApp } from "../../../mod.ts";

export const seedTownshipsSetup = () =>
	coreApp.acts.setAct({
		schema: "township", // The primary schema this act operates on
		fn: seedTownshipsFn,
		actName: "seedTownships",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"], // Seeding should be an admin-level task
			}),
		],
		validator: seedTownshipsValidator(),
	});
