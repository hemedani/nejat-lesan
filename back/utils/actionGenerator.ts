// generate.ts
import { ensureDir } from "jsr:@std/fs";

// Load env
const model = Deno.env.get("MODEL");

if (!model) {
  console.error("MODEL not defined in .env");
  Deno.exit(1);
}

const folder = `./${model}`;
await ensureDir(folder);

const files = {
  "gets.ts": `\
"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const gets = async ({
  set,
  get,
}: ReqType["main"]["${model}"]["gets"]) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "${model}",
      act: "gets",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
`,

  "get.ts": `\
"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const get = async (_id: string, get?: ReqType["main"]["${model}"]["get"]["get"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "${model}",
      act: "get",
      details: {
        set: {
          _id,
        },
        get: {
          _id: 1,
          name: 1,
          ...get
        },
      },
    },
    { token }
  );
};
`,

  "count.ts": `\
"use server";
import { AppApi } from "@/services/api";
import { ReqType } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const count = async ({ set, get }: ReqType["main"]["${model}"]["count"]) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "${model}",
      act: "count",
      details: {
        set,
        get,
      },
    },
    { token: token?.value }
  );
};
`,

  "update.ts": `\
"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const update = async (_id: string, name: string) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "${model}",
      act: "update",
      details: {
        set: {
          _id,
          name,
        },
        get: {
          name: 1,
        },
      },
    },
    { token: token?.value }
  );
};
`,

  "add.ts": `\
"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const add = async (name: string) => {
  const token = (await cookies()).get("token");
  return await AppApi().send(
    {
      service: "main",
      model: "${model}",
      act: "add",
      details: {
        set: {
          name,
        },
        get: {
          name: 1,
        },
      },
    },
    { token: token?.value }
  );
};
`,

  "remove.ts": `\
"use server";
import { AppApi } from "@/services/api";
import { cookies } from "next/headers";

export const remove = async (_id: string, hardCascade: boolean) => {
  const token = (await cookies()).get("token");

  return await AppApi().send(
    {
      service: "main",
      model: "${model}",
      act: "remove",
      details: {
        set: { _id, hardCascade },
        get: { success: 1 },
      },
    },
    { token: token?.value }
  );
};
`,
};

// Write each file
for (const [fileName, content] of Object.entries(files)) {
  const path = `${folder}/${fileName}`;
  await Deno.writeTextFile(path, content);
  console.log(`✅ Created: ${path}`);
}


function snakeToKebabCase(input: string): string {
  return input.replace(/_/g, "-");
}

const pageContent = `\
import ClientCommonModelDashboard from "@/components/template/clientCommonModelDashboard";
import SearchBox from "@/components/molecules/SearchBox";
import Pagination from "@/components/molecules/Pagination";
import { ReqType } from "@/types/declarations/selectInp";
import { gets } from "@/app/actions/${model}/gets";
import { count } from "@/app/actions/${model}/count";
import { remove } from "@/app/actions/${model}/remove";
import { add } from "@/app/actions/${model}/add";
import { update } from "@/app/actions/${model}/update";
import { translateModelNameToPersian } from "@/utils/helper";

export default async function AirStatusDashboard({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["${model}"]["gets"]["set"]>;
}) {
  const { limit = "20", page = "1", name } = await searchParams;

  const set: ReqType["main"]["${model}"]["gets"]["set"] = {
    limit: +limit || 20,
    page: +page,
    name,
  };
  const get: ReqType["main"]["${model}"]["gets"]["get"] = {
    _id: 1,
    name: 1,
  };

  const data = await gets({ set, get });
  const counted = await count({
    set: set.name ? { name: set.name } : {},
    get: { qty: 1 },
  });

  return (
    <div className="relative min-h-full">
      <div className="flex items-start">
        <div className="bg-blue-500 w-1 h-8 ml-3 rounded-full"></div>
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            {translateModelNameToPersian("${model}")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت {translateModelNameToPersian("${model}")}
          </p>
        </div>
      </div>
      <SearchBox title="name" defaultValue={name} />
      <ClientCommonModelDashboard data={data.success ? data.body : []} model="${model}" remove={remove} add={add} update={update} />
      <Pagination countPage={counted?.body.qty} initialPage={+page} />
    </div>
  );
}
`

function removeLastSegment(path: string): string {
  return path.replace(/\/actions\/?$/, "");
}

const pagePath = removeLastSegment(Deno.cwd())

await ensureDir(`${pagePath}/admin/${snakeToKebabCase(model)}`)
await Deno.writeTextFile(`${pagePath}/admin/${snakeToKebabCase(model)}/page.tsx`, pageContent);
console.log(`✅ Page Created: ${pagePath}/admin/${snakeToKebabCase(model)}/page.tsx`);
