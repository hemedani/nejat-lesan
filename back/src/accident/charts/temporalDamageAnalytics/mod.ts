/**
 * -----------------------------------------------------------------------------
 * FILE: temporalDamageAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalDamageAnalytics" act. This endpoint provides time-series
 * data for the "Temporal Comparison of Damages and Collision Type" chart, analyzing
 * the share of accidents with specific damage sections over time.
 */
import { createChartAuthMiddleware, setTokens, setUser } from "@lib";
import { temporalDamageAnalyticsFn } from "./temporalDamageAnalytics.fn.ts";
import { temporalDamageAnalyticsValidator } from "./temporalDamageAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalDamageAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalDamageAnalyticsFn,
		actName: "temporalDamageAnalytics",
		preValidation: [
			setTokens,
			setUser,
			createChartAuthMiddleware("temporalDamageAnalytics"),
		],
		validator: temporalDamageAnalyticsValidator(),
	});
