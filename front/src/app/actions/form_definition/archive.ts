"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { FORM_DEFINITION_PROJECTION } from "./projection";

/**
 * Retire a live form without deleting it.
 *
 * The last active accident form of an organization cannot be archived — replacing
 * it goes through `activate`, which archives the old one in the same step. The
 * backend refuses it and returns a Persian message, which the caller surfaces.
 */
export async function archiveFormDefinition(request: { set: { _id: string } }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "form_definition",
      act: "archive",
      details: {
        set: request.set,
        get: FORM_DEFINITION_PROJECTION as never,
      },
    },
    { token: token?.value },
  );
}
