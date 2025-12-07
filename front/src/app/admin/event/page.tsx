import EventDashboard from "@/components/template/EventDashboard";
import SearchBox from "@/components/molecules/SearchBox";
import Pagination from "@/components/molecules/Pagination";
import { ReqType } from "@/types/declarations/selectInp";
import { gets } from "@/app/actions/event/gets";
import { count } from "@/app/actions/event/count";
import { remove } from "@/app/actions/event/remove";
import { cookies } from "next/headers";

import { translateModelNameToPersian } from "@/utils/helper";

export default async function EventDashboardPage({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["event"]["gets"]["set"]>;
}) {
  const { limit = "20", page = "1", name } = await searchParams;

  const set: ReqType["main"]["event"]["gets"]["set"] = {
    limit: +limit || 20,
    page: +page,
    ...(name && { name }), // Only include name if it exists
  };
  const get: ReqType["main"]["event"]["gets"]["get"] = {
    _id: 1,
    name: 1,
    description: 1,
    dates: 1,
  };

  const data = await gets({ set, get });
  const counted = await count({
    set: { ...(name && { name }) },
    get: { count: 1 },
  });

  const token = (await cookies()).get("token");
  const lesanUrl = process.env.LESAN_URL
    ? process.env.LESAN_URL
    : "http://localhost:1382";

  return (
    <div className="relative min-h-full">
      <div className="flex items-start">
        <div className="bg-blue-500 w-1 h-8 ml-3 rounded-full"></div>
        <div>
          <h1 className="text-2xl md:text-3xl text-gray-800 font-bold">
            {translateModelNameToPersian("event")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت {translateModelNameToPersian("event")}
          </p>
        </div>
      </div>

      <SearchBox title="name" defaultValue={name} />
      <EventDashboard
        data={data.success ? data.body : []}
        model="event"
        remove={remove}
        token={token?.value}
        lesanUrl={lesanUrl}
      />
      <Pagination countPage={counted?.body.count} initialPage={+page} />
    </div>
  );
}
