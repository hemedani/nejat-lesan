/**
 * -----------------------------------------------------------------------------
 * FILE: monthlyHolidayAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the new "monthlyHolidayAnalytics" act. This endpoint provides data
 * for the "Count of accidents on holiday/non-holiday days by month" chart.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { monthlyHolidayAnalyticsFn } from "./monthlyHolidayAnalytics.fn.ts";
import { monthlyHolidayAnalyticsValidator } from "./monthlyHolidayAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const monthlyHolidayAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: monthlyHolidayAnalyticsFn,
		actName: "monthlyHolidayAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("monthlyHolidayAnalytics"),
		],
		validator: monthlyHolidayAnalyticsValidator(),
	});
