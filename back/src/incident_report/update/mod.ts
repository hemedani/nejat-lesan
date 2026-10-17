import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "incident_report",
		fn: updateFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
			grantAccess({ levels: ["Manager", "Patrol"] }),
		],
		validator: updateValidator(),
		// `create`, not the default `assert`: the four `coerce(date(), string(), …)`
		// fields in `setSchema.ts` only run on the create path, and JSON carries no
		// `Date`, so under `assert` the raw string reaches `date()` and a correction
		// carrying `occurred_at` is rejected. This matches `add`.
		//
		// The cost to know about before touching the shared set schema:
		// `create()` also *fills* `defaulted(...)`, so adding a default to any
		// field of `incident_report_set_schema` would overwrite the stored value on
		// every update that omits it. Keep defaults in the act body, not the schema.
		// `test/coerced-date-validation-test.ts` guards both halves.
		validationRunType: "create",
	});
