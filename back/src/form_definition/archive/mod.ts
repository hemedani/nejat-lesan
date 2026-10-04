import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { archiveFn } from "./archive.fn.ts";
import { archiveValidator } from "./archive.val.ts";

export const archiveSetup = () =>
	coreApp.acts.setAct({
		schema: "form_definition",
		fn: archiveFn,
		actName: "archive",
		preAct: [
			setTokens,
			setUser,
			grantAccess({ levels: ["Manager", "OrgHead", "UnitHead"] }),
		],
		validator: archiveValidator(),
	});
