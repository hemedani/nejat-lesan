/**
 * -----------------------------------------------------------------------------
 * FILE: spatialSeverityAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "spatialSeverityAnalytics" act. This endpoint provides data for
 * the "Spatial Comparison of Accident Severity Share" dashboard, including data
 * for both the stacked bar chart and the zonal map.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { spatialSeverityAnalyticsFn } from "./spatialSeverityAnalytics.fn.ts";
import { spatialSeverityAnalyticsValidator } from "./spatialSeverityAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const spatialSeverityAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: spatialSeverityAnalyticsFn,
		actName: "spatialSeverityAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: spatialSeverityAnalyticsValidator(),
	});
