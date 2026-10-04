import { enums, object, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { incident_report_set_schema } from "../setSchema.ts";

export const addValidator = () =>
	object({
		set: object({
			...incident_report_set_schema,

			// Which app build filed this report (snapshot, see
			// `incident_report_submitted_from_struct`). `add` only: a correction of
			// a returned report must not restamp the build that originally filed it.
			// `organization` is resolved server-side and is deliberately not an input.
			submitted_from: object({
				app_version: string(),
				platform: enums(["ios", "android"]),
			}),
		}),
		get: selectStruct("incident_report", 1),
	});
