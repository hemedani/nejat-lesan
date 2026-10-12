import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { cleanupDemoSeedFn } from "./cleanupDemoSeed.fn.ts";
import { cleanupDemoSeedValidator } from "./cleanupDemoSeed.val.ts";

export const cleanupDemoSeedSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: cleanupDemoSeedFn,
		actName: "cleanupDemoSeed",
		preAct: [
			setTokens,
			setUser,
			// Manager or Ghost, matching the seeds it undoes. `setModules` is
			// Ghost-only, but this act does not re-implement that gate: a Manager
			// running the `modules` scope deletes the singleton and it returns
			// all-on, which is the permissive default and never a way to switch a
			// module *off*. Gating the scope here would also stop a Manager running
			// the documented rebuild order in one pass, since `all` includes it.
			grantAccess({
				levels: ["Manager", "Ghost"],
			}),
		],
		validator: cleanupDemoSeedValidator(),
	});
