"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["announcement"]["gets"];

/**
 * Announcements visible to the caller. The backend gates this act to
 * Patrol/Manager, so callers must be level-gated in the UI.
 */
export async function getAnnouncementRows(request: { set?: Partial<Act["set"]>; get?: Record<string, unknown> } = {}) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "announcement",
      act: "gets",
      details: {
        set: { page: 1, limit: 50, ...request.set },
        get: (request.get ?? {}) as never,
      },
    },
    { token: token?.value },
  );
}
