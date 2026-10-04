import { type ActFn } from "@deps";
import { throwError } from "@lib";
import { bindableRelationsFor } from "../helpers.ts";

/**
 * The relations a form question may bind to, read from the target model itself.
 *
 * An author picks from this list, so a binding that could not be stored can never
 * be authored. `activate` re-checks the same list as a backstop.
 */
export const getBindableRelationsFn: ActFn = async (body) => {
	const { formKind } = body.details.set;
	const resolved = (formKind as string) ?? "accident";
	if (resolved !== "accident" && resolved !== "incident_report") {
		return throwError("نوع فرم معتبر نیست");
	}

	return { formKind: resolved, relations: bindableRelationsFor(resolved) };
};
