import { type ActFn } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { type MyContext } from "@lib";
import { orgFilterFor } from "../helpers.ts";

/** Count definitions, scoped to the caller's own organization. */
export const countFn: ActFn = async (body) => {
	const { set } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const { organizationId, status, form_kind } = set;

	const filters: Record<string, unknown> = {
		...(await orgFilterFor(user, organizationId as string | undefined)),
	};
	if (status) filters.status = status;
	if (form_kind) filters.form_kind = form_kind;

	return { qty: await form_definition.countDocument({ filter: filters }) };
};
