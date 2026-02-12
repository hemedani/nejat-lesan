/**
 * -----------------------------------------------------------------------------
 * FILE: eventCollisionAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "eventCollisionAnalytics" act. This endpoint provides data for
 * comparing the share of collision types during a specific event vs. other times.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { eventCollisionAnalyticsFn } from "./eventCollisionAnalytics.fn.ts";
import { eventCollisionAnalyticsValidator } from "./eventCollisionAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const eventCollisionAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: eventCollisionAnalyticsFn,
		actName: "eventCollisionAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("eventCollisionAnalytics"),
		],
		validator: eventCollisionAnalyticsValidator(),
	});
