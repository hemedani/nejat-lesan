import { enums, object, objectIdValidation, optional } from "@deps";
import { form_definition_kind_emums } from "@model";

/**
 * `get` here is a want-marker, not a projection.
 *
 * The act's fn returns its whole payload and the framework never narrows it by
 * `get` (serveLesan.ts returns `act.fn(body)` verbatim), so the only job `get`
 * has is to *validate*. The codebase idiom for a marker is `enums([0, 1])`,
 * which every client sends as `1`.
 *
 * Declaring the *response* type instead (`object({})`, `string()`) makes that
 * idiomatic `1` fail validation — which is what produced
 * "At path: get.form -- Expected an object, but received: 1" on mobile.
 */
export const getForPatrolValidator = () =>
	object({
		set: object({
			/** Which kind of report is being filed. */
			formKind: optional(form_definition_kind_emums),
			orgId: optional(objectIdValidation),
			/** Re-validate a draft against a specific definition version. */
			definitionId: optional(objectIdValidation),
		}),
		get: object({
			form: optional(enums([0, 1])),
			options: optional(enums([0, 1])),
			version: optional(enums([0, 1])),
		}),
	});
