import { number, object, optional } from "@deps";
import { oversightFilterStruct } from "../filterStruct.ts";

export const getOversightListValidator = () =>
	object({
		set: object({
			// Shared with `getOversightStats`, which aggregates the same population:
			// a filter only one of the two accepts would leave the officer table
			// counting rows the list is not showing.
			...oversightFilterStruct(),
			page: optional(number()),
			limit: optional(number()),
		}),
		// Empty on purpose: the projection lives in the pipeline (ROW_PROJECTION), and
		// an empty struct means a client cannot widen it.
		get: object({}),
	});
