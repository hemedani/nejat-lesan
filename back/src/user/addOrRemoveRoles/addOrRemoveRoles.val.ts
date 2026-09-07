import { array, object, objectIdValidation, optional, string } from "@deps";
import { selectStruct } from "../../../mod.ts";
import { role_scope_type_emums, user_role_emums } from "@model";

const roleInput = object({
	name: user_role_emums,
	scopeType: optional(role_scope_type_emums),
	scopeId: optional(string()),
});

export const addOrRemoveRolesValidator = () => {
	return object({
		set: object({
			_id: objectIdValidation,
			addRoles: optional(array(roleInput)),
			removeRoles: optional(array(roleInput)),
		}),
		get: selectStruct("user", 1),
	});
};
