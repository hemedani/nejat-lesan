"use server";
import { AUTH_COOKIE } from "@/utils/auth-constants";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";

export interface QuestionModelInfo {
  model_name: string;
  multi: boolean;
  targetKind: "relation" | "dto" | "dynamic";
}

export async function getQuestionModels() {
  const token = (await cookies()).get(AUTH_COOKIE);
  return AppApi().send(
    {
      service: "main",
      model: "accident_process",
      act: "getQuestionModels",
      details: { set: {}, get: { models: 1 } },
    },
    { token: token?.value },
  );
}
