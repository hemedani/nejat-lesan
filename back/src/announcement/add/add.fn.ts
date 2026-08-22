import { type ActFn, ObjectId } from "@deps";
import { coreApp, announcement, user } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { throwError } from "@lib";

export const addAnnouncementFn: ActFn = async (body) => {
	const context: MyContext = coreApp.contextFns
		.getContextModel() as MyContext;
	const actor = context.user;

	const {
		set: {
			title,
			body: bodyText,
			priority,
			target_roles,
			target_user_ids,
			target_patrol_units,
			expires_at,
			attachmentIds,
		},
		get,
	} = body.details;

	const doc: Record<string, any> = {
		title,
		body: bodyText,
		priority: priority || "info",
		target_roles: target_roles || [],
		target_user_ids: target_user_ids || [],
		target_patrol_units: target_patrol_units || [],
		is_active: true,
	};

	if (expires_at) {
		doc.expires_at = new Date(expires_at);
	}

	const relations: Record<string, any> = {
		registrer: {
			_ids: new ObjectId(actor._id),
			relatedRelations: {},
		},
	};

	if (attachmentIds && attachmentIds.length > 0) {
		relations.attachments = {
			_ids: attachmentIds.map((id: string) => new ObjectId(id)),
			relatedRelations: {},
		};
	}

	return await announcement.insertOne({
		doc,
		relations,
		projection: get,
	});
};