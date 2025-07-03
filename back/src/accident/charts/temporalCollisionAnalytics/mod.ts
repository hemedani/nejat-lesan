/**
 * -----------------------------------------------------------------------------
 * FILE: temporalCollisionAnalytics.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "temporalCollisionAnalytics" act. This endpoint provides time-series
 * data for the "Temporal Comparison of Collision Manner and Type" chart.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { temporalCollisionAnalyticsFn } from "./temporalCollisionAnalytics.fn.ts";
import { temporalCollisionAnalyticsValidator } from "./temporalCollisionAnalytics.val.ts";
import { coreApp } from "../../../../mod.ts";

export const temporalCollisionAnalyticsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: temporalCollisionAnalyticsFn,
		actName: "temporalCollisionAnalytics",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: temporalCollisionAnalyticsValidator(),
	});
