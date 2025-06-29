import { hourlyDayOfWeekAnalyticsSetup } from "./hourlyDayOfWeekAnalytics/mod.ts";
import { monthlyHolidayAnalyticsSetup } from "./monthlyHolidayAnalytics/mod.ts";
import { roadDefectsAnalyticsSetup } from "./roadDefectsAnalytics/mod.ts";
import { roadDefectsAnalyticsWithCountSetup } from "./roadDefectsAnalyticsFnWithCount/mod.ts";

export const chartSetup = () => {
	roadDefectsAnalyticsSetup();
	roadDefectsAnalyticsWithCountSetup();
	monthlyHolidayAnalyticsSetup();
	hourlyDayOfWeekAnalyticsSetup();
};
