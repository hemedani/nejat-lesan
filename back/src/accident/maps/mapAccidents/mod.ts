/**
 * -----------------------------------------------------------------------------
 * FILE: mapAccidents.setup.ts
 * -----------------------------------------------------------------------------
 * DESCRIPTION:
 * Registers the "mapAccidents" act. This endpoint is designed to find and return
 * a list of individual accident documents for plotting on a map, complete with
 * comprehensive filtering and pagination.
 */
import { grantAccess, setTokens, setUser } from "@lib";
import { mapAccidentsFn } from "./mapAccidents.fn.ts";
import { mapAccidentsValidator } from "./mapAccidents.val.ts";
import { coreApp } from "../../../../mod.ts";

export const mapAccidentsSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: mapAccidentsFn,
		actName: "mapAccidents",
		preAct: [
			setTokens,
			setUser,
			grantAccess({
				levels: ["Manager"],
			}),
		],
		validator: mapAccidentsValidator(),
	});
