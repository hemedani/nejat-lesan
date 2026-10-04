import { array, boolean, enums, object, optional, string } from "@deps";

const SCOPES = ["demo", "reference", "modules", "all"];

const counts = object({
	organizations: optional(enums([0, 1])),
	roads: optional(enums([0, 1])),
	units: optional(enums([0, 1])),
	users: optional(enums([0, 1])),
	vehicles: optional(enums([0, 1])),
	formDefinitions: optional(enums([0, 1])),
	formResponses: optional(enums([0, 1])),
	accidents: optional(enums([0, 1])),
	incidentReports: optional(enums([0, 1])),
	referenceRows: optional(enums([0, 1])),
	moduleConfig: optional(enums([0, 1])),
});

const preserved = object({
	referenceRows: optional(enums([0, 1])),
	names: optional(array(string())),
	note: optional(string()),
});

export const cleanupDemoSeedValidator = () => {
	return object({
		set: object({
			/**
			 * What to remove. Defaults to `["all"]`, and `all` is expanded to the
			 * three real scopes so the response names what actually ran.
			 *
			 * - `demo` — the organization, road, units, people, vehicles and forms
			 *   `user.seedDemoOrganization` created, plus any report those officers
			 *   filed. Matched on `organization.code` and the seed's own email
			 *   domain, never on "everything".
			 * - `reference` — only rows `user.seedShared` actually inserted, which
			 *   carry its marker. Rows it skipped because the name already existed
			 *   are reported under `preserved` and never deleted.
			 * - `modules` — the module-config singleton; `ensureModuleConfig`
			 *   recreates it as all-on at the next boot.
			 */
			scope: optional(array(enums(SCOPES))),
			/**
			 * Must be `true` to delete anything.
			 *
			 * Defaults to `false`, so the first call is always a dry run that
			 * reports exactly what a confirming call would remove. Deletion is not
			 * recoverable through the API, and a mistyped Playground payload must
			 * not be able to do it.
			 */
			confirm: optional(boolean()),
		}),
		get: object({
			dryRun: optional(boolean()),
			deleted: optional(boolean()),
			scope: optional(array(enums(SCOPES))),
			total: optional(enums([0, 1])),
			nothingToDo: optional(boolean()),
			wouldDelete: optional(counts),
			removed: optional(counts),
			preserved: optional(preserved),
		}),
	});
};
