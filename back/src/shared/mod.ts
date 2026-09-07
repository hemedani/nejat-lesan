import { setSharedActs } from "./setSharedActs.ts";
import { seedSharedSetup } from "./seedShared/mod.ts";
import {
	croquis_type,
	damage_severity,
	driver_status,
	incident_severity,
	injury_status,
	person_role,
	vehicle_final_status,
	vehicle_type,
} from "../../mod.ts";

export const sharedSetup = () => {
	setSharedActs("vehicle_type", vehicle_type);
	setSharedActs("croquis_type", croquis_type);
	setSharedActs("vehicle_final_status", vehicle_final_status);
	setSharedActs("driver_status", driver_status);
	setSharedActs("injury_status", injury_status);
	setSharedActs("person_role", person_role);
	setSharedActs("damage_severity", damage_severity);
	setSharedActs("incident_severity", incident_severity);
	seedSharedSetup();
};
