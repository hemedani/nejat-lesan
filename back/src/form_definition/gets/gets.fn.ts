import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { type MyContext } from "@lib";
import { orgFilterFor } from "../helpers.ts";

/**
 * List definitions, scoped to the caller's own organization.
 *
 * Without this, a patrol officer calling `gets` with no filter would receive
 * every organization's forms.
 */
export const getsFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const {
		page = 1,
		limit = 50,
		skip,
		organizationId,
		status,
		form_kind,
		search,
	} = set;

	const filters: Record<string, unknown> = {
		...(await orgFilterFor(user, organizationId as string | undefined)),
	};
	if (status) filters.status = status;
	if (form_kind) filters.form_kind = form_kind;
	if (search) filters.name = { $regex: String(search), $options: "i" };

	return await form_definition
		.find({ filters, projection: get })
		.sort({ _id: -1 })
		.skip(skip ?? limit * (page - 1))
		.limit(limit)
		.toArray();
};
