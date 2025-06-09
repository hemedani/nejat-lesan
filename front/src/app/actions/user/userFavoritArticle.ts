"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const addFavorite = async (_id: string) => {
  const token = (await cookies()).get("token");
  const getMe = await AppApi().send(
    {
      service: "main",
      model: "user",
      act: "toggleFavArticle",
      details: {
        set: { articleId: _id },
        get: {
          _id: 1,
          first_name: 1,
        },
      },
    },
    { token: token?.value }
  );

  if (getMe.success) return getMe.body;
};
