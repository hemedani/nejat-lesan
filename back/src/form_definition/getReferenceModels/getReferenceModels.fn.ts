import { type ActFn } from "@deps";
import * as models from "../../../mod.ts";
import { referenceModelsFor } from "../helpers.ts";

/**
 * Every model a `reference` question may draw its options from, with whether it
 * has any records.
 *
 * `hasRecords` is the important half: an option source pointing at an empty model
 * renders an empty dropdown on the officer's phone, and `activate` refuses it.
 * The builder used to keep its own copy of this list and had already drifted 16
 * models behind the server's allow-list, so this is now the only list.
 */
export const getReferenceModelsFn: ActFn = async () => {
	return { models: await referenceModelsFor(models as never) };
};
