"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import type { ReqType } from "@/types/declarations/selectInp";

export async function getReportReviewHistory(
  request: ReqType["main"]["accident"]["getReportReviewHistory"],
) {
  const token = (await cookies()).get("token");
  return AppApi().send(
    { service: "main", model: "accident", act: "getReportReviewHistory", details: request },
    { token: token?.value },
  );
}
