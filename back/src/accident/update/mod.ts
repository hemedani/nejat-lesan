import { setTokens, setUser } from "@lib";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { coreApp } from "../../../mod.ts";

export const updateSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: updateFn,
		actName: "update",
		preAct: [
			setTokens,
			setUser,
		],
		validator: updateValidator(),
		// `create`, not the default `assert`: the six `coerce(date(), string(), …)`
		// fields in `accidentSetSchema` only run on the create path, and JSON
		// carries no `Date`, so under `assert` the raw string reaches `date()` and
		// a correction carrying `date_of_accident` is rejected. This matches `add`.
		//
		// The cost to know about before touching the shared set schema:
		// `create()` also *fills* `defaulted(...)`, so adding a default to any
		// field of `accidentSetSchema` would overwrite the stored value on every
		// update that omits it. Keep defaults in the act body, not the schema.
		// `test/coerced-date-validation-test.ts` guards both halves.
		validationRunType: "create",
	});
