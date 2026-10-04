import { type ActFn, ObjectId } from "@deps";
import { coreApp, form_definition } from "../../../mod.ts";
import { type MyContext } from "@lib";
import { orgFilterFor } from "../helpers.ts";

/**
 * Read one definition.
 *
 * Scoped to the caller's own organization: a form encodes an org's internal
 * reporting structure, so a patrol officer must not be able to read another
 * organization's form by guessing its id.
 */
export const getFn: ActFn = async (body) => {
	const { set, get } = body.details;
	const { user }: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;

	const orgFilter = await orgFilterFor(
		user,
		set.organizationId as string | undefined,
	);

	return await form_definition
		.aggregation({
			pipeline: [{
				$match: {
					_id: new ObjectId(set._id as string),
					...orgFilter,
				},
			}],
			projection: get,
		})
		.toArray();
};
