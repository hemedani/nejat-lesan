import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition, incident_report } from "../../../mod.ts";
import { resolveUserOrgId } from "../../form_definition/helpers.ts";
import { resolveFilingOrgId } from "../../accident/reportScope.ts";
import { type MyContext, throwError } from "@lib";
import { splitRelationIds } from "../relations.ts";

/**
 * Create a report from one of the organization's active forms.
 *
 * The form is resolved **server-side** and its title and icon are taken from the
 * stored definition rather than from the request, so a client cannot file a report
 * under a form that is inactive, belongs to another organization, or is of the
 * wrong kind — and cannot mislabel it in the review console.
 */
export const addFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const formDefinitionId = set.form_definition_id as string;

	// --- 0. Officer attribution and the client's sync claim --------------------
	// Without this an officer could file a report attributed to a colleague, which
	// would land in that colleague's history and their manager's dashboard. The
	// sync-status check only polices what a client may *assert*; what the server
	// records is decided in 4b below, where the arrival is.
	if (user.level === "Patrol") {
		const requested = set.sync_status as string | undefined;
		if (requested && !["draft", "queued"].includes(requested)) {
			return throwError(
				"مأمور گشت تنها می‌تواند گزارش با وضعیت draft یا queued ثبت کند",
			);
		}
		if (set.officerId && set.officerId !== user._id.toString()) {
			return throwError(
				"مأمور گشت نمی‌تواند گزارش را به مأمور دیگری نسبت دهد",
			);
		}
		// `set` is the validated payload the rest of this act reads from.
		(set as Record<string, unknown>).officerId = user._id.toString();
	}

	// --- 1. Idempotency: a retried submission must not duplicate the report ---
	const clientReportUuid = set.client_report_uuid as string | undefined;
	if (clientReportUuid) {
		const existing = await incident_report.findOne({
			filters: { client_report_uuid: clientReportUuid },
			projection: get,
		});
		if (existing) return existing;
	}

	// --- 2. Resolve and authorize the form -------------------------------------
	const actorOrgId = user.level === "Patrol"
		? await resolveUserOrgId(user._id)
		: null;

	const form = await form_definition.findOne({
		filters: {
			_id: new ObjectId(formDefinitionId),
			status: "active",
			...(actorOrgId
				? { "organization._id": new ObjectId(actorOrgId) }
				: {}),
		},
		projection: {
			_id: 1,
			name: 1,
			icon: 1,
			form_kind: 1,
			"organization._id": 1,
		},
	});
	if (!form) return throwError("فرم فعال یافت نشد");

	const definition = form as unknown as {
		name: string;
		icon?: string;
		form_kind?: string;
		organization?: { _id?: ObjectId };
	};
	if ((definition.form_kind ?? "accident") !== "incident_report") {
		return throwError("این فرم برای گزارش رخداد نیست");
	}

	// --- 3. Split relation ids from the document body --------------------------
	const { doc: body_, relations } = splitRelationIds(
		set as Record<string, unknown>,
	);

	// Form provenance is server-derived, never client-supplied.
	delete body_.form_definition_id;
	const doc: Record<string, unknown> = {
		...body_,
		form_definition_id: new ObjectId(formDefinitionId),
		form_title: definition.name,
		...(definition.icon && { form_icon: definition.icon }),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	// --- 4. Serial + report id -------------------------------------------------
	if (doc.serial === undefined) {
		const [maxDoc] = await incident_report
			.aggregation({
				pipeline: [{ $sort: { serial: -1 } }, { $limit: 1 }],
				projection: { serial: 1 },
			})
			.toArray();
		doc.serial = ((maxDoc?.serial as number) ?? 0) + 1;
	}
	if (!doc.report_id) {
		const year = new Date().getFullYear();
		doc.report_id = `INC-${year}-${String(doc.serial).padStart(6, "0")}`;
	}

	// --- 4b. The arrival *is* the sync -----------------------------------------
	// Every report filed through this act arrived through the app: `submitted_from`
	// is *required* by the validator (`add.val.ts`), which is what makes this act an
	// app-only entry point rather than a control-centre one. So the arrival is
	// recorded unconditionally — the row is `synced` from the moment it exists, and
	// `synced_at` is stamped here because this is the only moment the server observes
	// the arrival (the per-officer "median sync time" is `synced_at - reported_at`).
	//
	// Recording `queued` instead — a claim about the device's local queue, on a
	// document only the server owns — made every app report unreviewable: `queued` is
	// the state the review gate refuses, a Patrol may only write `draft|queued`, and
	// no console action writes `synced`, so nothing could ever promote one.
	doc.sync_status = "synced";
	doc.synced_at = new Date();
	if (doc.review_status === undefined) {
		doc.review_status = "submitted";
	}

	// --- 5. Provenance: link the filing organization, for app submissions ------
	// `submitted_from` is the app declaring which build filed the report, so its
	// presence is the signal that this is an app submission. The organization is
	// then resolved from the session — never from the request.
	if (doc.submitted_from) {
		const roadRelation = relations.road as
			| { _ids?: ObjectId }
			| undefined;
		const filingOrgId = await resolveFilingOrgId(
			user as unknown as Parameters<typeof resolveFilingOrgId>[0],
			roadRelation?._ids?.toString() ?? null,
		);
		if (filingOrgId) {
			relations.organization = {
				_ids: filingOrgId,
				relatedRelations: {},
			};
		}
		// Unresolvable organization is not an error: the report is still filed and
		// the console groups it under "unlinked".
	}

	return await incident_report.insertOne({
		doc: doc as never,
		relations: relations as never,
		projection: get,
	});
};
