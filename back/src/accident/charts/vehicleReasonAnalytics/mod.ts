/**
 * -----------------------------------------------------------------------------
 * FILE: vehicleReasonAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "vehicleReasonAnalytics" act. This endpoint provides data for
 * the two-part "Distribution of Effective Vehicle Factor in Severe Accidents" chart.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { vehicleReasonAnalyticsFn } from "./vehicleReasonAnalytics.fn.ts";
import { vehicleReasonAnalyticsValidator } from "./vehicleReasonAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const vehicleReasonAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: vehicleReasonAnalyticsFn,
		actName: "vehicleReasonAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("vehicleReasonAnalytics"),
		],
		validator: vehicleReasonAnalyticsValidator(),
	});
