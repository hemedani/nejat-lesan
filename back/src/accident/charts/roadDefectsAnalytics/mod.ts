/**
 * -----------------------------------------------------------------------------
 * FILE: roadDefectsAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * This file registers the new "roadDefectsAnalytics" act with the core application.
 * This act is specifically designed to provide aggregated data for the
 * "Effective Road Defects" chart on the dashboard.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { roadDefectsAnalyticsFn } from "./roadDefectsAnalytics.fn.ts";
import { roadDefectsAnalyticsValidator } from "./roadDefectsAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const roadDefectsAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: roadDefectsAnalyticsFn,
		actName: "roadDefectsAnalytics", // New, specific act name
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("roadDefectsAnalytics"),
		],
		validator: roadDefectsAnalyticsValidator(),
	});
