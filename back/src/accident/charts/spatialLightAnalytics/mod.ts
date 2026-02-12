/**
 * -----------------------------------------------------------------------------
 * FILE: spatialLightAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "spatialLightAnalytics" act. This endpoint provides data for
 * the "Spatial Comparison of Lighting Conditions" dashboard.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { spatialLightAnalyticsFn } from "./spatialLightAnalytics.fn.ts";
import { spatialLightAnalyticsValidator } from "./spatialLightAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const spatialLightAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: spatialLightAnalyticsFn,
		actName: "spatialLightAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("spatialLightAnalytics"),
		],
		validator: spatialLightAnalyticsValidator(),
	});
