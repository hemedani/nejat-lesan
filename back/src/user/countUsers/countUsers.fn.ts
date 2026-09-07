import type { ActFn } from "@deps";
import { coreApp, user } from "../../../mod.ts";
import { type MyContext } from "@lib";
import { buildOrgUserRolesMatch, resolveUsersOrgScope } from "@lib";

export const countUsersFn: ActFn = async (body) => {
	const {
		set: { levels, organizationId, search },
	} = body.details;

	const context = coreApp.contextFns.getContextModel() as MyContext;
	const actor = context.user;

	const effectiveOrg = await resolveUsersOrgScope(actor, organizationId);

	const conditions: Record<string, unknown>[] = [];
	levels && conditions.push({ level: levels });
	const rolesMatch = await buildOrgUserRolesMatch(effectiveOrg);
	if (Object.keys(rolesMatch).length) conditions.push(rolesMatch);

	if (search && typeof search === "string") {
		const regex = new RegExp(
			search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
			"i",
		);
		conditions.push({
			$or: [
				{ first_name: { $regex: regex } },
				{ last_name: { $regex: regex } },
				{ email: { $regex: regex } },
				{ personnel_code: { $regex: regex } },
			],
		});
	}

	const filter = conditions.length === 1
		? conditions[0]
		: conditions.length > 1
		? { $and: conditions }
		: {};

	const qty = await user.countDocument({ filter });

	return { qty };
};
