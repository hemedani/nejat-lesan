import { accidentSeverityAnalyticsSetup } from "./accidentSeverityAnalytics/mod.ts";
import { collisionAnalyticsSetup } from "./collisionAnalytics/mod.ts";
import { hourlyDayOfWeekAnalyticsSetup } from "./hourlyDayOfWeekAnalytics/mod.ts";
import { monthlyHolidayAnalyticsSetup } from "./monthlyHolidayAnalytics/mod.ts";
import { roadDefectsAnalyticsSetup } from "./roadDefectsAnalytics/mod.ts";
import { roadDefectsAnalyticsWithCountSetup } from "./roadDefectsAnalyticsFnWithCount/mod.ts";
import { totalReasonAnalyticsSetup } from "./totalReasonAnalytics/mod.ts";

export const chartSetup = () => {
	roadDefectsAnalyticsSetup();
	roadDefectsAnalyticsWithCountSetup();
	monthlyHolidayAnalyticsSetup();
	hourlyDayOfWeekAnalyticsSetup();
	collisionAnalyticsSetup();
	accidentSeverityAnalyticsSetup();
	totalReasonAnalyticsSetup();
};
