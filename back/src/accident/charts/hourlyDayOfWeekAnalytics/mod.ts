/**
 * -----------------------------------------------------------------------------
 * FILE: hourlyDayOfWeekAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the new "hourlyDayOfWeekAnalytics" act. This endpoint provides
 * data for the "Count of accidents by hour and day of the week" heatmap chart.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { hourlyDayOfWeekAnalyticsFn } from "./hourlyDayOfWeekAnalytics.fn.ts";
import { hourlyDayOfWeekAnalyticsValidator } from "./hourlyDayOfWeekAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const hourlyDayOfWeekAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: hourlyDayOfWeekAnalyticsFn,
		actName: "hourlyDayOfWeekAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("hourlyDayOfWeekAnalytics"),
		],
		validator: hourlyDayOfWeekAnalyticsValidator(),
	});
