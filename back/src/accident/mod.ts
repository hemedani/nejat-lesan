import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { getMyReportsSetup } from "./getMyReports/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { removeByCreatedAtSetup } from "./removeByCreatedAt/mod.ts";
import { getCreatedAtPeriodsSetup } from "./getCreatedAtPeriods/mod.ts";
import { countSetup } from "./count/mod.ts";
import { chartSetup } from "./charts/mod.ts";
import { mapSetup } from "./maps/mod.ts";
import { getSyncStatusSetup } from "./getSyncStatus/mod.ts";
import { reviewReportSetup } from "./reviewReport/mod.ts";
import { dashboardSetup } from "./dashboard/mod.ts";
import { reviewHistorySetup } from "./reviewHistory/mod.ts";
import { resubmitReportSetup } from "./resubmitReport/mod.ts";

export const accidentSetup = () => {
	addSetup();
	updateSetup();
	getSetup();
	getsSetup();
	getMyReportsSetup();
	removeSetup();
	removeByCreatedAtSetup();
	getCreatedAtPeriodsSetup();
	countSetup();
	getSyncStatusSetup();
	reviewReportSetup();
	dashboardSetup();
	reviewHistorySetup();
	resubmitReportSetup();

	//chart functions
	chartSetup();

	// map functions
	mapSetup();
};
