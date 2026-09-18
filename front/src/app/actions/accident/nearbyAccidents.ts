"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

/**
 * Accidents inside a geographic box — the lightweight map feed used by the
 * patrol mobile app and the employee panel.
 *
 * The backend gates this act to Patrol (requires `patrol_permissions.can_view_map`),
 * Manager and Ghost. Every other level is rejected, so callers must be
 * level-gated in the UI as well.
 */
export const nearbyAccidents = async (
  details: ReqType["main"]["accident"]["nearbyAccidents"],
) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "nearbyAccidents",
      details,
    },
    { token: token?.value },
  );
};
