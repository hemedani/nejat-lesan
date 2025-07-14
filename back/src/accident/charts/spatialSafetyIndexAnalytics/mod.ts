/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSafetyIndexAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "spatialSafetyIndexAnalytics" act. This endpoint provides data for
 * the "Spatial Comparison of Regional Safety Index" dashboard.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { spatialSafetyIndexAnalyticsFn } from "./spatialSafetyIndexAnalytics.fn.ts";
import { spatialSafetyIndexAnalyticsValidator } from "./spatialSafetyIndexAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const spatialSafetyIndexAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: spatialSafetyIndexAnalyticsFn,
		actName: "spatialSafetyIndexAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: spatialSafetyIndexAnalyticsValidator(),
	});
