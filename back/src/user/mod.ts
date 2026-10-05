import { addUserSetup } from "./addUser/mod.ts";
import { changeUserPasswordSetup } from "./changeUserPassword/mod.ts";
import { getMeSetup } from "./getMe/mod.ts";
import { getUserSetup } from "./getUser/mod.ts";
import { loginUserSetup } from "./login/mod.ts";
import { getUserDevicesSetup } from "./getUserDevices/mod.ts";
import { revokeDeviceSetup } from "./revokeDevice/mod.ts";
import { removeDeviceSetup } from "./removeDevice/mod.ts";
import { registerUserSetup } from "./register/mod.ts";
import { tempUserSetup } from "./tempUser/mod.ts";
import { setGhostPasswordSetup } from "./setGhostPassword/mod.ts";
import { updateUserSetup } from "./updateUser/mod.ts";
import { getUsersSetup } from "./getUsers/mod.ts";
import { removeUserSetup } from "./removeUser/mod.ts";
import { countUsersSetup } from "./countUsers/mod.ts";
import { updateUserRelationsSetup } from "./updateUserRelations/mod.ts";
import { dashboardStatisticSetup } from "./dashboardStatistic/mod.ts";
import { seedSetup } from "./seed/mod.ts";
import { getPatrolOfficersSetup } from "./getPatrolOfficers/mod.ts";
import { addOrRemoveRolesSetup } from "./addOrRemoveRoles/mod.ts";
import { seedDemoOrganizationSetup } from "./seedDemoOrganization/mod.ts";
import { cleanupDemoSeedSetup } from "./cleanupDemoSeed/mod.ts";

export const userSetup = () => {
	addUserSetup();
	getMeSetup();
	getUserSetup();
	loginUserSetup();
	getUserDevicesSetup();
	revokeDeviceSetup();
	removeDeviceSetup();
	tempUserSetup();
	setGhostPasswordSetup();
	updateUserSetup();
	registerUserSetup();
	changeUserPasswordSetup();
	getUsersSetup();
	removeUserSetup();
	countUsersSetup();
	updateUserRelationsSetup();
	dashboardStatisticSetup();
	getPatrolOfficersSetup();
	seedSetup();
	addOrRemoveRolesSetup();
	// The demo-organization seed and its cleanup are registered here, not from
	// `src/mod.ts`: they are `user` acts, so they belong to this module's setup.
	// They were defined but never called — the same silent class of bug as the
	// missing `formDefinitionSetup`, invisible to any textual audit because the
	// `setAct` calls exist on disk either way. Verify registration at runtime.
	seedDemoOrganizationSetup();
	cleanupDemoSeedSetup();
};
