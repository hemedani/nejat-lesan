"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

type Act = ReqType["main"]["announcement"]["markRead"];

/** Marks one announcement as read for the calling officer. */
export async function markAnnouncementRead(request: { set: Act["set"] }) {
  const token = (await cookies()).get(AUTH_COOKIE);
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
