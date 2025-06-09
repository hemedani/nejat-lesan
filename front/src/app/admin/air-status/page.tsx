import ClientCommonModelDashboard from "@/components/template/clientCommonModelDashboard";
import SearchBox from "@/components/molecules/SearchBox";
import Pagination from "@/components/molecules/Pagination";
import { ReqType } from "@/types/declarations/selectInp";
import { gets } from "@/app/actions/air_status/gets";
import { count } from "@/app/actions/air_status/count";
import { remove } from "@/app/actions/air_status/remove";
import { add } from "@/app/actions/air_status/add";
import { update } from "@/app/actions/air_status/update";
import { translateModelNameToPersian } from "@/utils/helper";

export default async function AirStatusDashboard({
  searchParams,
}: {
  searchParams: Promise<ReqType["main"]["air_status"]["gets"]["set"]>;
}) {
  const { limit = "20", page = "1", name } = await searchParams;

  const set: ReqType["main"]["air_status"]["gets"]["set"] = {
    limit: +limit || 20,
    page: +page,
    name,
  };
  const get: ReqType["main"]["air_status"]["gets"]["get"] = {
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
            {translateModelNameToPersian("air_status")}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            مدیریت {translateModelNameToPersian("air_status")}
          </p>
        </div>
      </div>
      <SearchBox title="name" defaultValue={name} />
      <ClientCommonModelDashboard data={data.success ? data.body : []} model="air_status" remove={remove} add={add} update={update} />
      <Pagination countPage={counted?.body.qty} initialPage={+page} />
    </div>
  );
}
