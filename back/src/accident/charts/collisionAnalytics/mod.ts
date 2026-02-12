/**
 * -----------------------------------------------------------------------------
 * FILE: collisionAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the new "collisionAnalytics" act. This endpoint provides all the
 * necessary aggregated data for the complex "Collision Type" dashboard, which
 * includes multiple doughnut and bar charts.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { collisionAnalyticsFn } from "./collisionAnalytics.fn.ts";
import { collisionAnalyticsValidator } from "./collisionAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const collisionAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: collisionAnalyticsFn,
		actName: "collisionAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("collisionAnalytics"),
		],
		validator: collisionAnalyticsValidator(),
	});
