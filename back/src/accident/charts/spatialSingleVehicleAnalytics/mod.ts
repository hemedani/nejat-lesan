/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSingleVehicleAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "spatialSingleVehicleAnalytics" act. This endpoint provides data for
 * the "Spatial Comparison of Single-Vehicle Accidents" dashboard.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { spatialSingleVehicleAnalyticsFn } from "./spatialSingleVehicleAnalytics.fn.ts";
import { spatialSingleVehicleAnalyticsValidator } from "./spatialSingleVehicleAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const spatialSingleVehicleAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: spatialSingleVehicleAnalyticsFn,
		actName: "spatialSingleVehicleAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("spatialSingleVehicleAnalytics"),
		],
		validator: spatialSingleVehicleAnalyticsValidator(),
	});
