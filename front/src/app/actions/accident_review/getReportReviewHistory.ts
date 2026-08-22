"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";
import { historyProjection } from "@/services/patrol-projections";

type Request = {
  set: { reportId: string; page?: number; limit?: number };
  get: Record<string, unknown>;
};

export async function getReportReviewHistory(request: Request) {
  const token = (await cookies()).get("token");
  return AppApi().send({ service: "main", model: "accident_review", act: "getReportReviewHistory", details: {
    set: request.set,
    get: { ...historyProjection, ...request.get } as never,
  } }, { token: token?.value });
}
