import { grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { getFn } from "./get.fn.ts";
import { getValidator } from "./get.val.ts";

export const getSetup = () =>
	coreApp.acts.setAct({
		schema: "accident",
		fn: getFn,
		actName: "get",
		// This act used to carry no `preAct` at all: no token, no user, no level check,
		// and a `$match` on `_id` alone. Any caller that could reach the endpoint could
		// read any accident in the collection — and an accident carries victim names,
		// national codes, insurance numbers and phone numbers in
		// `vehicle_dtos`/`people_dtos`. Absent a `preAct` is not the same as intended
		// to be absent, so the tenancy rule is enforced here and in `get.fn.ts`.
		preAct: [
			setTokens,
			setUser,
			grantAccess({ levels: ["Manager", "Patrol", "OrgHead", "UnitHead"] }),
		],
		validator: getValidator(),
	});
