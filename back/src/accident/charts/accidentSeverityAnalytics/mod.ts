/**
 * -----------------------------------------------------------------------------
 * FILE: accidentSeverityAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "accidentSeverityAnalytics" act. This endpoint provides counts
 * for each accident severity type (Fatal, Injury, Damage) to power a doughnut chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { accidentSeverityAnalyticsFn } from "./accidentSeverityAnalytics.fn.ts";
import { accidentSeverityAnalyticsValidator } from "./accidentSeverityAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const accidentSeverityAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: accidentSeverityAnalyticsFn,
		actName: "accidentSeverityAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: accidentSeverityAnalyticsValidator(),
	});
