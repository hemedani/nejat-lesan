/**
 * -----------------------------------------------------------------------------
 * FILE: eventSeverityAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "eventSeverityAnalytics" act. This endpoint provides data for
 * comparing accident severity during a specific event vs. other times.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { eventSeverityAnalyticsFn } from "./eventSeverityAnalytics.fn.ts";
import { eventSeverityAnalyticsValidator } from "./eventSeverityAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const eventSeverityAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: eventSeverityAnalyticsFn,
		actName: "eventSeverityAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: eventSeverityAnalyticsValidator(),
	});
