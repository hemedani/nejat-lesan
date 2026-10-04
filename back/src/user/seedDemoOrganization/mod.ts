import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { seedDemoOrganizationFn } from "./seedDemoOrganization.fn.ts";
import { seedDemoOrganizationValidator } from "./seedDemoOrganization.val.ts";

export const seedDemoOrganizationSetup = () =>
	coreApp.acts.setAct({
		schema: "user",
		fn: seedDemoOrganizationFn,
		actName: "seedDemoOrganization",
		// `preAct` و نه `preValidation`: هارنس تست فقط `act.preAct` را صدا
		// می‌زند، پس `preValidation` زیر تست هرگز اجرا نمی‌شد.
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: seedDemoOrganizationValidator(),
	});
