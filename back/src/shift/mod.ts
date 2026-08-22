import { assignShiftSetup } from "./assignShift/mod.ts";
import { getActiveShiftSetup } from "./getActiveShift/mod.ts";
import { endShiftSetup } from "./endShift/mod.ts";
import { getShiftsSetup } from "./getShifts/mod.ts";

export const shiftSetup = () => {
	assignShiftSetup();
	getActiveShiftSetup();
	endShiftSetup();
	getShiftsSetup();
};