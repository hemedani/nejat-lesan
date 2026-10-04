import { addSetup } from "./add/mod.ts";
import { countSetup } from "./count/mod.ts";
import { dashboardValidator } from "./dashboard/dashboard.val.ts";
import { incidentReportDashboardSetup } from "./dashboard/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getMyReportsSetup } from "./getMyReports/mod.ts";
import { getSyncStatusSetup } from "./getSyncStatus/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { oversightSetup } from "./oversight/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { resubmitReportSetup } from "./resubmitReport/mod.ts";
import { reviewHistorySetup } from "./reviewHistory/mod.ts";
import { reviewReportSetup } from "./reviewReport/mod.ts";
import { updateSetup } from "./update/mod.ts";

export { dashboardValidator };

export const incidentReportSetup = () => {
	addSetup();
	updateSetup();
	getSetup();
	getsSetup();
	countSetup();
	removeSetup();
	getMyReportsSetup();
	getSyncStatusSetup();
	reviewReportSetup();
	reviewHistorySetup();
	resubmitReportSetup();
	incidentReportDashboardSetup();
	oversightSetup();
};
