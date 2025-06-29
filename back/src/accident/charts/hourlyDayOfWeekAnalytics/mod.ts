/**
 * -----------------------------------------------------------------------------
 * FILE: hourlyDayOfWeekAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the new "hourlyDayOfWeekAnalytics" act. This endpoint provides
 * data for the "Count of accidents by hour and day of the week" heatmap chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { hourlyDayOfWeekAnalyticsFn } from "./hourlyDayOfWeekAnalytics.fn.ts";
import { hourlyDayOfWeekAnalyticsValidator } from "./hourlyDayOfWeekAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const hourlyDayOfWeekAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: hourlyDayOfWeekAnalyticsFn,
		actName: "hourlyDayOfWeekAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: hourlyDayOfWeekAnalyticsValidator(),
	});
