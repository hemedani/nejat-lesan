"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";

export interface QuestionModelInfo {
  model_name: string;
  multi: boolean;
  targetKind: "relation" | "dto" | "dynamic";
}

export async function getQuestionModels() {
  const token = (await cookies()).get("token");
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
