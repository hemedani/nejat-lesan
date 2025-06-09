import { lesanApi } from "@/types/declarations/selectInp";

const envLesanUrl = process.env.LESAN_URL as string;

export const AppApi = (lesanUrl?: string) =>
  lesanApi({
    URL: lesanUrl
      ? lesanUrl
      : envLesanUrl
        ? `${envLesanUrl}/lesan`
        : "http://localhost:1404/lesan",
    baseHeaders: {
      connection: "keep-alive",
    },
  });
