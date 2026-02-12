/**
 * -----------------------------------------------------------------------------
 * FILE: spatialCollisionAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "spatialCollisionAnalytics" act. This endpoint provides data for
 * the "Spatial Comparison of Collision Manner and Type" dashboard.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { spatialCollisionAnalyticsFn } from "./spatialCollisionAnalytics.fn.ts";
import { spatialCollisionAnalyticsValidator } from "./spatialCollisionAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const spatialCollisionAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: spatialCollisionAnalyticsFn,
		actName: "spatialCollisionAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("spatialCollisionAnalytics"),
		],
		validator: spatialCollisionAnalyticsValidator(),
	});
