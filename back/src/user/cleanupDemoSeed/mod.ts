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
			// Ghost-only, so a Manager cleaning the `modules` scope gets that
			// scope's own refusal rather than a silently skipped reset.
			grantAccess({
				levels: ["Manager", "Ghost"],
			}),
		],
		validator: cleanupDemoSeedValidator(),
	});
