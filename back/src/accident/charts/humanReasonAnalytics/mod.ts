/**
 * -----------------------------------------------------------------------------
 * FILE: humanReasonAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "humanReasonAnalytics" act. This endpoint provides data for
 * the "Distribution of Effective Human Factor in Accidents" treemap chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { humanReasonAnalyticsFn } from "./humanReasonAnalytics.fn.ts";
import { humanReasonAnalyticsValidator } from "./humanReasonAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const humanReasonAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: humanReasonAnalyticsFn,
		actName: "humanReasonAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: humanReasonAnalyticsValidator(),
	});
