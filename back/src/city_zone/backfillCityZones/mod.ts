import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { backfillCityZonesFn } from "./backfillCityZones.fn.ts";
import { backfillCityZonesValidator } from "./backfillCityZones.val.ts";

export const backfillCityZonesSetup = () =>
	coreApp.acts.setAct({
		schema: "city_zone",
		fn: backfillCityZonesFn,
		actName: "backfillCityZones",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: backfillCityZonesValidator(),
	});
