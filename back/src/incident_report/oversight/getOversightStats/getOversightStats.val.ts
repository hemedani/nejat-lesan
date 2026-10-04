import { number, object, optional } from "@deps";
import { oversightFilterStruct } from "../filterStruct.ts";

export const getOversightStatsValidator = () =>
	object({
		set: object({
			// The list's whole filter surface, not a date range and a threshold:
			// the counts here sit above the rows that same list returns, so a filter
			// the list applies but these statistics ignore leaves the two visibly
			// disagreeing. Everything but the threshold comes from the shared struct,
			// so neither act can grow a filter alone.
			...oversightFilterStruct(),
			/** How long a report may sit in a stalling state before it counts as stuck. */
			thresholdHours: optional(number()),
		}),
		// Empty on purpose, as in `getOversightList`: the shapes are built in the
		// pipeline, and an empty struct means a client cannot widen them.
		get: object({}),
	});
