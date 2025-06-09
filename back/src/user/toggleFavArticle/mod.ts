import { setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { toggleFavArticleFn } from "./toggleFavArticle.fn.ts";
import { toggleFavArticleValidator } from "./toggleFavArticle.val.ts";

export const toggleFavArticleSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    fn: toggleFavArticleFn,
    actName: "toggleFavArticle",
    preAct: [setTokens, setUser],
    validator: toggleFavArticleValidator(),
  });
