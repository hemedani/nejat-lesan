"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["announcement"]["markRead"];

/** Marks one announcement as read for the calling officer. */
export async function markAnnouncementRead(request: { set: Act["set"] }) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    {
      service: "main",
      model: "announcement",
      act: "markRead",
      details: { set: request.set, get: { _id: 1 } as never },
    },
    { token: token?.value },
  );
}
